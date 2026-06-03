use crate::contract::Contract;
use crate::errors::Error;
use crate::types::{
    AgentProfile, AgentRole, AgentStatus, Attestation, Config, DataKey, FeeModel, Loan,
    LoanRequest, LoanStatus, NetworkStats, PrivacyMode, Reputation,
};
use soroban_sdk::{Address, Env, Vec};

impl Contract {
    pub(crate) fn config(env: &Env) -> Config {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("config must be initialized")
    }

    pub(crate) fn config_is_valid(config: &Config) -> bool {
        config.min_request_amount > 0
            && config.max_request_amount >= config.min_request_amount
            && config.default_starting_credit_limit >= config.min_request_amount
            && config.late_threshold_seconds > 0
    }

    pub(crate) fn empty_stats() -> NetworkStats {
        NetworkStats {
            loan_requests_posted: 0,
            loans_funded: 0,
            loans_repaid: 0,
            total_xlm_lent: 0,
            total_fees_paid: 0,
            total_repayment_seconds: 0,
        }
    }

    pub(crate) fn default_reputation(config: &Config, agent: Address) -> Reputation {
        Reputation {
            agent,
            score: 50,
            successful_repayments: 0,
            late_repayments: 0,
            defaults: 0,
            total_borrowed: 0,
            total_repaid: 0,
            current_credit_limit: config.default_starting_credit_limit,
            open_borrowed_amount: 0,
        }
    }

    pub(crate) fn ensure_reputation(env: &Env, agent: Address) -> Reputation {
        let key = DataKey::AgentReputation(agent.clone());
        let reputation = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Self::default_reputation(&Self::config(env), agent));
        env.storage().persistent().set(&key, &reputation);
        reputation
    }

    pub(crate) fn set_reputation(env: &Env, reputation: &Reputation) {
        env.storage().persistent().set(
            &DataKey::AgentReputation(reputation.agent.clone()),
            reputation,
        );
    }

    pub(crate) fn require_role(
        env: &Env,
        agent: &Address,
        allow_lender: bool,
        allow_borrower: bool,
    ) -> Result<AgentProfile, Error> {
        let profile: AgentProfile = env
            .storage()
            .persistent()
            .get(&DataKey::Agent(agent.clone()))
            .ok_or(Error::AgentNotRegistered)?;
        if profile.status != AgentStatus::Active {
            return Err(Error::AgentNotActive);
        }
        let role_ok = match profile.role {
            AgentRole::Both => true,
            AgentRole::Lender => allow_lender,
            AgentRole::Borrower => allow_borrower,
        };
        if !role_ok {
            return Err(Error::RoleNotAllowed);
        }
        Ok(profile)
    }

    pub(crate) fn validate_amount_and_fee(
        config: &Config,
        amount: i128,
        fee_model: &FeeModel,
    ) -> Result<(), Error> {
        if amount < config.min_request_amount || amount > config.max_request_amount {
            return Err(Error::InvalidAmount);
        }
        if fee_model.base_fee_bps > fee_model.max_fee_bps
            || fee_model.step_seconds == 0
            || fee_model.max_fee_bps > 10_000
        {
            return Err(Error::InvalidFeeModel);
        }
        Ok(())
    }

    pub(crate) fn validate_attestation(
        env: &Env,
        privacy_mode: &PrivacyMode,
        attestation: &Attestation,
    ) -> Result<(), Error> {
        if privacy_mode.require_attestation {
            match attestation {
                Attestation::None => return Err(Error::AttestationRequired),
                Attestation::Present(attestation) => {
                    if attestation.expires_at <= env.ledger().timestamp() {
                        return Err(Error::AttestationExpired);
                    }
                }
            }
        }
        Ok(())
    }

    pub(crate) fn next_counter(env: &Env, key: DataKey) -> Result<u64, Error> {
        let next = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(0u64)
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        env.storage().persistent().set(&key, &next);
        Ok(next)
    }

    pub(crate) fn require_request(env: &Env, loan_request_id: u64) -> Option<LoanRequest> {
        env.storage()
            .persistent()
            .get(&DataKey::LoanRequest(loan_request_id))
    }

    pub(crate) fn require_loan(env: &Env, loan_id: u64) -> Option<Loan> {
        env.storage().persistent().get(&DataKey::Loan(loan_id))
    }

    pub(crate) fn validate_policy(
        env: &Env,
        lender: &Address,
        policy: &crate::types::LenderPolicy,
        request: &LoanRequest,
    ) -> Result<(), Error> {
        if request.amount > policy.max_single_loan_amount
            || request.fee_model.base_fee_bps < policy.min_fee_bps
        {
            return Err(Error::PolicyMismatch);
        }
        if policy.max_duration_seconds > 0
            && Self::config(env).late_threshold_seconds > policy.max_duration_seconds
        {
            return Err(Error::PolicyMismatch);
        }

        let reputation = Self::ensure_reputation(env, request.borrower.clone());
        if reputation.score < policy.min_reputation_score {
            return Err(Error::PolicyMismatch);
        }
        if !policy.allow_repeat_borrower
            && Self::has_lender_funded_borrower(env, lender, &request.borrower)
        {
            return Err(Error::PolicyMismatch);
        }

        let exposure = Self::active_lender_exposure(env, lender)
            .checked_add(request.amount)
            .ok_or(Error::MathOverflow)?;
        if exposure > policy.max_total_exposure {
            return Err(Error::PolicyMismatch);
        }
        Ok(())
    }

    pub(crate) fn active_lender_exposure(env: &Env, lender: &Address) -> i128 {
        let ids = Self::id_list(env, DataKey::ActiveLoanIds);
        let mut total = 0i128;
        let mut index = 0u32;
        while index < ids.len() {
            let id = ids.get(index).unwrap();
            if let Some(loan) = Self::require_loan(env, id) {
                if loan.lender == *lender && loan.status == LoanStatus::Active {
                    total = total.saturating_add(loan.principal);
                }
            }
            index += 1;
        }
        total
    }

    pub(crate) fn has_lender_funded_borrower(
        env: &Env,
        lender: &Address,
        borrower: &Address,
    ) -> bool {
        let ids = Self::id_list(env, DataKey::AgentLoanIds(lender.clone()));
        let mut index = 0u32;
        while index < ids.len() {
            let id = ids.get(index).unwrap();
            if let Some(loan) = Self::require_loan(env, id) {
                if loan.borrower == *borrower {
                    return true;
                }
            }
            index += 1;
        }
        false
    }

    pub(crate) fn amount_due_at(loan: &Loan, now: u64) -> Result<i128, Error> {
        let elapsed = now.checked_sub(loan.funded_at).ok_or(Error::MathOverflow)?;
        let model = &loan.fee_model;
        let base_fee_bps = model.base_fee_bps as u64;
        let max_fee_bps = model.max_fee_bps as u64;
        let step_fee_bps = model.step_fee_bps as u64;
        let steps = elapsed / model.step_seconds;
        let fee_bps = if step_fee_bps == 0 {
            base_fee_bps
        } else {
            let remaining = max_fee_bps.saturating_sub(base_fee_bps);
            let capped_steps = Self::min_u64(steps, remaining / step_fee_bps);
            base_fee_bps + capped_steps * step_fee_bps
        };
        let fee = loan
            .principal
            .checked_mul(fee_bps as i128)
            .ok_or(Error::MathOverflow)?
            / 10_000;
        loan.principal.checked_add(fee).ok_or(Error::MathOverflow)
    }

    pub(crate) fn id_list(env: &Env, key: DataKey) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::<u64>::new(env))
    }

    pub(crate) fn push_id(env: &Env, key: DataKey, id: u64) {
        let mut ids = Self::id_list(env, key.clone());
        ids.push_back(id);
        env.storage().persistent().set(&key, &ids);
    }

    pub(crate) fn remove_id(env: &Env, key: DataKey, id: u64) {
        let mut ids = Self::id_list(env, key.clone());
        let mut index = 0u32;
        while index < ids.len() {
            if ids.get(index).unwrap() == id {
                ids.remove(index);
                env.storage().persistent().set(&key, &ids);
                return;
            }
            index += 1;
        }
    }

    pub(crate) fn min_i128(a: i128, b: i128) -> i128 {
        if a < b {
            a
        } else {
            b
        }
    }

    pub(crate) fn min_u64(a: u64, b: u64) -> u64 {
        if a < b {
            a
        } else {
            b
        }
    }
}
