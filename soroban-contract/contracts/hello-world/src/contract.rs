use crate::errors::Error;
use crate::events::{
    AgentRegistered, LoanDefaulted, LoanFunded, LoanRepaid, LoanRequestCancelled,
    LoanRequestPosted, PolicyUpdated, ReputationChanged,
};
use crate::types::{
    AgentProfile, AgentRole, AgentStatus, Config, DataKey, FeeModel, LenderPolicy,
    Loan, LoanRequest, LoanRequestStatus, LoanStatus, NetworkStats, PrivacyMode, Reputation,
    PrivacyProof,
};
use soroban_sdk::{contract, contractimpl, token, Address, BytesN, Env, MuxedAddress, String, Vec};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn __constructor(env: Env, config: Config) {
        assert!(Self::config_is_valid(&config));

        env.storage().instance().set(&DataKey::Config, &config);
        env.storage()
            .persistent()
            .set(&DataKey::NetworkStats, &Self::empty_stats());
        env.storage()
            .persistent()
            .set(&DataKey::LoanRequestCounter, &0u64);
        env.storage().persistent().set(&DataKey::LoanCounter, &0u64);
        env.storage()
            .persistent()
            .set(&DataKey::ActiveLoanRequestIds, &Vec::<u64>::new(&env));
        env.storage()
            .persistent()
            .set(&DataKey::ActiveLoanIds, &Vec::<u64>::new(&env));
    }

    pub fn register_agent(
        env: Env,
        agent: Address,
        display_name: String,
        role: AgentRole,
        public_metadata_hash: BytesN<32>,
    ) -> Result<(), Error> {
        agent.require_auth();

        let created_at = Self::get_agent(env.clone(), agent.clone())
            .map(|profile| profile.created_at)
            .unwrap_or_else(|| env.ledger().timestamp());
        let profile = AgentProfile {
            address: agent.clone(),
            display_name,
            role,
            created_at,
            status: AgentStatus::Active,
            public_metadata_hash,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Agent(agent.clone()), &profile);
        Self::ensure_reputation(&env, agent.clone());

        AgentRegistered {
            agent,
            created_at: profile.created_at,
        }
        .publish(&env);
        Ok(())
    }

    pub fn set_lender_policy(env: Env, lender: Address, policy: LenderPolicy) -> Result<(), Error> {
        lender.require_auth();

        if lender != policy.lender
            || policy.max_single_loan_amount <= 0
            || policy.max_total_exposure < policy.max_single_loan_amount
            || policy.min_fee_bps > 10_000
        {
            return Err(Error::PolicyMismatch);
        }

        Self::require_role(&env, &lender, true, false)?;
        env.storage()
            .persistent()
            .set(&DataKey::LenderPolicy(lender.clone()), &policy);

        PolicyUpdated {
            lender,
            max_single_loan_amount: policy.max_single_loan_amount,
        }
        .publish(&env);
        Ok(())
    }

    pub fn post_loan_request(
        env: Env,
        borrower: Address,
        amount: i128,
        fee_model: FeeModel,
        purpose_hash: BytesN<32>,
        privacy_mode: PrivacyMode,
        eligibility_proof: PrivacyProof,
    ) -> Result<u64, Error> {
        borrower.require_auth();

        let config = Self::config(&env);
        Self::require_role(&env, &borrower, false, true)?;
        Self::validate_amount_and_fee(&config, amount, &fee_model)?;

        let reputation = Self::ensure_reputation(&env, borrower.clone());
        let exposure = reputation
            .open_borrowed_amount
            .checked_add(amount)
            .ok_or(Error::MathOverflow)?;
        if exposure > reputation.current_credit_limit {
            return Err(Error::CreditLimitExceeded);
        }

        let request_id = Self::next_counter(&env, DataKey::LoanRequestCounter)?;
        Self::validate_and_record_proof(&env, &privacy_mode, &eligibility_proof)?;
        let request = LoanRequest {
            id: request_id,
            borrower: borrower.clone(),
            amount,
            fee_model,
            purpose_hash,
            privacy_mode,
            eligibility_proof,
            status: LoanRequestStatus::Open,
            created_at: env.ledger().timestamp(),
            funded_loan_id: None,
        };

        env.storage()
            .persistent()
            .set(&DataKey::LoanRequest(request_id), &request);
        Self::push_id(&env, DataKey::ActiveLoanRequestIds, request_id);
        Self::push_id(
            &env,
            DataKey::AgentLoanRequestIds(borrower.clone()),
            request_id,
        );

        let mut stats = Self::get_network_stats(env.clone());
        stats.loan_requests_posted = stats
            .loan_requests_posted
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        env.storage()
            .persistent()
            .set(&DataKey::NetworkStats, &stats);

        LoanRequestPosted {
            borrower,
            loan_request_id: request_id,
        }
        .publish(&env);
        Ok(request_id)
    }

    pub fn cancel_loan_request(
        env: Env,
        borrower: Address,
        loan_request_id: u64,
    ) -> Result<(), Error> {
        borrower.require_auth();

        let mut request =
            Self::require_request(&env, loan_request_id).ok_or(Error::RequestNotFound)?;
        if request.borrower != borrower {
            return Err(Error::NotRequestBorrower);
        }
        if request.status != LoanRequestStatus::Open {
            return Err(Error::RequestNotOpen);
        }

        request.status = LoanRequestStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::LoanRequest(loan_request_id), &request);
        Self::remove_id(&env, DataKey::ActiveLoanRequestIds, loan_request_id);

        LoanRequestCancelled {
            borrower,
            loan_request_id,
        }
        .publish(&env);
        Ok(())
    }

    pub fn fund_loan_request(
        env: Env,
        lender: Address,
        loan_request_id: u64,
    ) -> Result<u64, Error> {
        lender.require_auth();

        Self::require_role(&env, &lender, true, false)?;
        let policy =
            Self::get_lender_policy(env.clone(), lender.clone()).ok_or(Error::PolicyMismatch)?;
        if !policy.enabled {
            return Err(Error::PolicyDisabled);
        }

        let mut request =
            Self::require_request(&env, loan_request_id).ok_or(Error::RequestNotFound)?;
        if request.status != LoanRequestStatus::Open {
            return Err(Error::RequestNotOpen);
        }
        if request.borrower == lender {
            return Err(Error::CannotFundOwnRequest);
        }

        Self::validate_policy(&env, &lender, &policy, &request)?;

        let loan_id = Self::next_counter(&env, DataKey::LoanCounter)?;
        let loan = Loan {
            id: loan_id,
            loan_request_id,
            borrower: request.borrower.clone(),
            lender: lender.clone(),
            principal: request.amount,
            fee_model: request.fee_model.clone(),
            funded_at: env.ledger().timestamp(),
            repaid_at: None,
            amount_repaid: 0,
            status: LoanStatus::Active,
            privacy_mode: request.privacy_mode.clone(),
        };

        let token_client = token::TokenClient::new(&env, &Self::config(&env).xlm_token);
        let borrower_muxed = MuxedAddress::from(request.borrower.clone());
        token_client.transfer(&lender, &borrower_muxed, &request.amount);

        request.status = LoanRequestStatus::Funded;
        request.funded_loan_id = Some(loan_id);
        env.storage()
            .persistent()
            .set(&DataKey::LoanRequest(loan_request_id), &request);
        env.storage()
            .persistent()
            .set(&DataKey::Loan(loan_id), &loan);
        Self::remove_id(&env, DataKey::ActiveLoanRequestIds, loan_request_id);
        Self::push_id(&env, DataKey::ActiveLoanIds, loan_id);
        Self::push_id(
            &env,
            DataKey::AgentLoanIds(request.borrower.clone()),
            loan_id,
        );
        Self::push_id(&env, DataKey::AgentLoanIds(lender.clone()), loan_id);

        let mut reputation = Self::ensure_reputation(&env, request.borrower.clone());
        reputation.open_borrowed_amount = reputation
            .open_borrowed_amount
            .checked_add(request.amount)
            .ok_or(Error::MathOverflow)?;
        reputation.total_borrowed = reputation
            .total_borrowed
            .checked_add(request.amount)
            .ok_or(Error::MathOverflow)?;
        Self::set_reputation(&env, &reputation);

        let mut stats = Self::get_network_stats(env.clone());
        stats.loans_funded = stats
            .loans_funded
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        stats.total_xlm_lent = stats
            .total_xlm_lent
            .checked_add(request.amount)
            .ok_or(Error::MathOverflow)?;
        env.storage()
            .persistent()
            .set(&DataKey::NetworkStats, &stats);

        LoanFunded { lender, loan_id }.publish(&env);
        ReputationChanged {
            agent: request.borrower,
            score: reputation.score,
        }
        .publish(&env);
        Ok(loan_id)
    }

    pub fn current_amount_due(env: Env, loan_id: u64) -> Result<i128, Error> {
        let loan = Self::require_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;
        if loan.status != LoanStatus::Active {
            return Err(Error::LoanNotActive);
        }
        Self::amount_due_at(&loan, env.ledger().timestamp())
    }

    pub fn repay_loan(env: Env, borrower: Address, loan_id: u64) -> Result<(), Error> {
        borrower.require_auth();

        let mut loan = Self::require_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;
        if loan.borrower != borrower {
            return Err(Error::NotLoanBorrower);
        }
        if loan.status != LoanStatus::Active {
            return Err(Error::LoanNotActive);
        }

        let now = env.ledger().timestamp();
        let amount_due = Self::amount_due_at(&loan, now)?;
        let fee_paid = amount_due
            .checked_sub(loan.principal)
            .ok_or(Error::MathOverflow)?;

        let token_client = token::TokenClient::new(&env, &Self::config(&env).xlm_token);
        let lender_muxed = MuxedAddress::from(loan.lender.clone());
        token_client.transfer(&borrower, &lender_muxed, &amount_due);

        loan.status = LoanStatus::Repaid;
        loan.repaid_at = Some(now);
        loan.amount_repaid = amount_due;
        env.storage()
            .persistent()
            .set(&DataKey::Loan(loan_id), &loan);
        Self::remove_id(&env, DataKey::ActiveLoanIds, loan_id);

        let config = Self::config(&env);
        let mut reputation = Self::ensure_reputation(&env, borrower.clone());
        reputation.open_borrowed_amount = reputation
            .open_borrowed_amount
            .checked_sub(loan.principal)
            .ok_or(Error::MathOverflow)?;
        reputation.total_repaid = reputation
            .total_repaid
            .checked_add(amount_due)
            .ok_or(Error::MathOverflow)?;

        let elapsed = now.checked_sub(loan.funded_at).ok_or(Error::MathOverflow)?;
        if elapsed < config.late_threshold_seconds {
            reputation.successful_repayments = reputation
                .successful_repayments
                .checked_add(1)
                .ok_or(Error::MathOverflow)?;
            reputation.score = reputation
                .score
                .saturating_add(config.reputation_success_increment);
            let raised_limit = reputation
                .current_credit_limit
                .checked_add(loan.principal)
                .ok_or(Error::MathOverflow)?;
            if config.max_request_amount > reputation.current_credit_limit {
                reputation.current_credit_limit =
                    Self::min_i128(raised_limit, config.max_request_amount);
            }
        } else {
            reputation.late_repayments = reputation
                .late_repayments
                .checked_add(1)
                .ok_or(Error::MathOverflow)?;
            reputation.score = reputation
                .score
                .saturating_sub(config.reputation_late_penalty);
        }
        Self::set_reputation(&env, &reputation);

        let mut stats = Self::get_network_stats(env.clone());
        stats.loans_repaid = stats
            .loans_repaid
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        stats.total_fees_paid = stats
            .total_fees_paid
            .checked_add(fee_paid)
            .ok_or(Error::MathOverflow)?;
        stats.total_repayment_seconds = stats
            .total_repayment_seconds
            .checked_add(elapsed)
            .ok_or(Error::MathOverflow)?;
        env.storage()
            .persistent()
            .set(&DataKey::NetworkStats, &stats);

        LoanRepaid {
            borrower: borrower.clone(),
            amount_due,
        }
        .publish(&env);
        ReputationChanged {
            agent: borrower,
            score: reputation.score,
        }
        .publish(&env);
        Ok(())
    }

    pub fn mark_defaulted(env: Env, admin: Address, loan_id: u64) -> Result<(), Error> {
        admin.require_auth();

        let config = Self::config(&env);
        if admin != config.admin {
            return Err(Error::NotAdmin);
        }

        let mut loan = Self::require_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;
        if loan.status != LoanStatus::Active {
            return Err(Error::LoanNotActive);
        }

        let now = env.ledger().timestamp();
        let elapsed = now.checked_sub(loan.funded_at).ok_or(Error::MathOverflow)?;
        if elapsed < config.late_threshold_seconds {
            return Err(Error::TooEarlyToDefault);
        }

        loan.status = LoanStatus::Defaulted;
        env.storage()
            .persistent()
            .set(&DataKey::Loan(loan_id), &loan);
        Self::remove_id(&env, DataKey::ActiveLoanIds, loan_id);

        let mut reputation = Self::ensure_reputation(&env, loan.borrower.clone());
        reputation.defaults = reputation
            .defaults
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        reputation.score = reputation
            .score
            .saturating_sub(config.reputation_default_penalty);
        reputation.open_borrowed_amount = reputation
            .open_borrowed_amount
            .checked_sub(loan.principal)
            .ok_or(Error::MathOverflow)?;
        Self::set_reputation(&env, &reputation);

        LoanDefaulted { admin, loan_id }.publish(&env);
        ReputationChanged {
            agent: loan.borrower,
            score: reputation.score,
        }
        .publish(&env);
        Ok(())
    }

    pub fn get_config(env: Env) -> Config {
        Self::config(&env)
    }

    pub fn get_agent(env: Env, agent: Address) -> Option<AgentProfile> {
        env.storage().persistent().get(&DataKey::Agent(agent))
    }

    pub fn get_lender_policy(env: Env, lender: Address) -> Option<LenderPolicy> {
        env.storage()
            .persistent()
            .get(&DataKey::LenderPolicy(lender))
    }

    pub fn get_reputation(env: Env, agent: Address) -> Reputation {
        env.storage()
            .persistent()
            .get(&DataKey::AgentReputation(agent.clone()))
            .unwrap_or_else(|| Self::default_reputation(&Self::config(&env), agent))
    }

    pub fn get_network_stats(env: Env) -> NetworkStats {
        env.storage()
            .persistent()
            .get(&DataKey::NetworkStats)
            .unwrap_or_else(Self::empty_stats)
    }

    pub fn get_loan_request(env: Env, loan_request_id: u64) -> Option<LoanRequest> {
        Self::require_request(&env, loan_request_id)
    }

    pub fn get_loan(env: Env, loan_id: u64) -> Option<Loan> {
        Self::require_loan(&env, loan_id)
    }

    pub fn list_open_loan_request_ids(env: Env) -> Vec<u64> {
        Self::id_list(&env, DataKey::ActiveLoanRequestIds)
    }

    pub fn list_active_loan_ids(env: Env) -> Vec<u64> {
        Self::id_list(&env, DataKey::ActiveLoanIds)
    }

    pub fn list_agent_loan_request_ids(env: Env, agent: Address) -> Vec<u64> {
        Self::id_list(&env, DataKey::AgentLoanRequestIds(agent))
    }

    pub fn list_agent_loan_ids(env: Env, agent: Address) -> Vec<u64> {
        Self::id_list(&env, DataKey::AgentLoanIds(agent))
    }
}
