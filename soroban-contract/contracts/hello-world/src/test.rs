#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env, String,
};

const BORROW_AMOUNT: i128 = 1_000;
const LENDER_START: i128 = 10_000;
const BORROWER_START: i128 = 2_000;

struct Fixture {
    env: Env,
    client: ContractClient<'static>,
    token: TokenClient<'static>,
    admin: Address,
    borrower: Address,
    lender: Address,
}

fn hash(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn fee_model() -> FeeModel {
    FeeModel {
        base_fee_bps: 200,
        step_fee_bps: 100,
        step_seconds: 15,
        max_fee_bps: 500,
    }
}

fn privacy_mode(require_eligibility_proof: bool) -> PrivacyMode {
    PrivacyMode {
        hide_purpose: true,
        require_proof: require_eligibility_proof,
    }
}

fn eligibility_proof(fixture: &Fixture, expires_at: u64, nullifier_byte: u8) -> PrivacyProof {
    PrivacyProof::Present(EligibilityProof {
        proof_hash: hash(&fixture.env, 9),
        public_inputs_hash: hash(&fixture.env, 10),
        reputation_root: hash(&fixture.env, 11),
        nullifier_hash: hash(&fixture.env, nullifier_byte),
        verifier: fixture.admin.clone(),
        expires_at,
    })
}

fn setup() -> Fixture {
    let env = Env::default();
    env.ledger().set_timestamp(1_000);
    env.mock_all_auths_allowing_non_root_auth();

    let admin = Address::generate(&env);
    let borrower = Address::generate(&env);
    let lender = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_id = token_contract.address();
    let token = TokenClient::new(&env, &token_id);
    let stellar_asset = StellarAssetClient::new(&env, &token_id);

    stellar_asset.mint(&borrower, &BORROWER_START);
    stellar_asset.mint(&lender, &LENDER_START);

    let config = Config {
        admin: admin.clone(),
        xlm_token: token_id,
        min_request_amount: 100,
        max_request_amount: 3_000,
        default_starting_credit_limit: 2_000,
        late_threshold_seconds: 45,
        reputation_success_increment: 5,
        reputation_late_penalty: 7,
        reputation_default_penalty: 20,
    };
    let contract_id = env.register(Contract, (config,));
    let client = ContractClient::new(&env, &contract_id);

    client.register_agent(
        &borrower,
        &String::from_str(&env, "Borrower Agent"),
        &AgentRole::Borrower,
        &hash(&env, 1),
    );
    client.register_agent(
        &lender,
        &String::from_str(&env, "Lender Agent"),
        &AgentRole::Lender,
        &hash(&env, 2),
    );
    client.set_lender_policy(
        &lender,
        &LenderPolicy {
            lender: lender.clone(),
            enabled: true,
            max_single_loan_amount: BORROW_AMOUNT,
            max_total_exposure: BORROW_AMOUNT * 2,
            min_reputation_score: 0,
            min_fee_bps: 200,
            max_duration_seconds: 60,
            allow_repeat_borrower: true,
        },
    );

    Fixture {
        env,
        client,
        token,
        admin,
        borrower,
        lender,
    }
}

fn post_request(fixture: &Fixture) -> u64 {
    fixture.client.post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &fee_model(),
        &hash(&fixture.env, 3),
        &privacy_mode(false),
        &PrivacyProof::None,
    )
}

#[test]
fn happy_path_funds_repay_and_updates_reputation_and_stats() {
    let fixture = setup();

    let request_id = post_request(&fixture);
    assert_eq!(request_id, 1);
    assert_eq!(fixture.client.list_open_loan_request_ids().len(), 1);
    assert_eq!(
        fixture
            .client
            .get_reputation(&fixture.borrower)
            .open_borrowed_amount,
        0
    );

    let loan_id = fixture
        .client
        .fund_loan_request(&fixture.lender, &request_id);
    assert_eq!(loan_id, 1);
    assert_eq!(fixture.client.list_open_loan_request_ids().len(), 0);
    assert_eq!(fixture.client.list_active_loan_ids().len(), 1);
    assert_eq!(
        fixture.token.balance(&fixture.borrower),
        BORROWER_START + BORROW_AMOUNT
    );
    assert_eq!(
        fixture.token.balance(&fixture.lender),
        LENDER_START - BORROW_AMOUNT
    );

    let reputation = fixture.client.get_reputation(&fixture.borrower);
    assert_eq!(reputation.open_borrowed_amount, BORROW_AMOUNT);
    assert_eq!(reputation.total_borrowed, BORROW_AMOUNT);

    fixture.env.ledger().set_timestamp(1_030);
    assert_eq!(fixture.client.current_amount_due(&loan_id), 1_040);

    fixture.client.repay_loan(&fixture.borrower, &loan_id);

    let loan = fixture.client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.status, LoanStatus::Repaid);
    assert_eq!(loan.amount_repaid, 1_040);
    assert_eq!(fixture.client.list_active_loan_ids().len(), 0);
    assert_eq!(
        fixture.token.balance(&fixture.borrower),
        BORROWER_START + BORROW_AMOUNT - 1_040
    );
    assert_eq!(
        fixture.token.balance(&fixture.lender),
        LENDER_START - BORROW_AMOUNT + 1_040
    );

    let reputation = fixture.client.get_reputation(&fixture.borrower);
    assert_eq!(reputation.score, 55);
    assert_eq!(reputation.successful_repayments, 1);
    assert_eq!(reputation.late_repayments, 0);
    assert_eq!(reputation.open_borrowed_amount, 0);
    assert_eq!(reputation.total_repaid, 1_040);
    assert_eq!(reputation.current_credit_limit, 3_000);

    let stats = fixture.client.get_network_stats();
    assert_eq!(stats.loan_requests_posted, 1);
    assert_eq!(stats.loans_funded, 1);
    assert_eq!(stats.loans_repaid, 1);
    assert_eq!(stats.total_xlm_lent, BORROW_AMOUNT);
    assert_eq!(stats.total_fees_paid, 40);
    assert_eq!(stats.total_repayment_seconds, 30);
}

#[test]
fn posting_checks_amount_fee_credit_and_proof() {
    let fixture = setup();

    let too_large = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &3_001,
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(false),
        &PrivacyProof::None,
    );
    assert_eq!(too_large, Err(Ok(Error::InvalidAmount)));

    let invalid_fee = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &FeeModel {
            base_fee_bps: 600,
            step_fee_bps: 100,
            step_seconds: 15,
            max_fee_bps: 500,
        },
        &hash(&fixture.env, 4),
        &privacy_mode(false),
        &PrivacyProof::None,
    );
    assert_eq!(invalid_fee, Err(Ok(Error::InvalidFeeModel)));

    let missing_proof = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(true),
        &PrivacyProof::None,
    );
    assert_eq!(missing_proof, Err(Ok(Error::ProofRequired)));

    let expired_proof = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(true),
        &eligibility_proof(&fixture, 1_000, 12),
    );
    assert_eq!(expired_proof, Err(Ok(Error::ProofExpired)));

    let proof_request = fixture.client.post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(true),
        &eligibility_proof(&fixture, 1_300, 12),
    );
    let stored = fixture.client.get_loan_request(&proof_request).unwrap();
    assert_eq!(stored.privacy_mode.require_proof, true);
    assert!(matches!(
        stored.eligibility_proof,
        PrivacyProof::Present(_)
    ));

    let replayed_proof = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &BORROW_AMOUNT,
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(true),
        &eligibility_proof(&fixture, 1_300, 12),
    );
    assert_eq!(replayed_proof, Err(Ok(Error::ProofReplayed)));

    fixture
        .client
        .cancel_loan_request(&fixture.borrower, &proof_request);

    let request_id = post_request(&fixture);
    fixture
        .client
        .fund_loan_request(&fixture.lender, &request_id);
    let over_credit = fixture.client.try_post_loan_request(
        &fixture.borrower,
        &(BORROW_AMOUNT + 1),
        &fee_model(),
        &hash(&fixture.env, 4),
        &privacy_mode(false),
        &PrivacyProof::None,
    );
    assert_eq!(over_credit, Err(Ok(Error::CreditLimitExceeded)));
}

#[test]
fn borrower_can_cancel_only_open_own_request() {
    let fixture = setup();
    let request_id = post_request(&fixture);

    fixture
        .client
        .cancel_loan_request(&fixture.borrower, &request_id);
    let request = fixture.client.get_loan_request(&request_id).unwrap();
    assert_eq!(request.status, LoanRequestStatus::Cancelled);
    assert_eq!(fixture.client.list_open_loan_request_ids().len(), 0);

    let cancelled_again = fixture
        .client
        .try_cancel_loan_request(&fixture.borrower, &request_id);
    assert_eq!(cancelled_again, Err(Ok(Error::RequestNotOpen)));
}

#[test]
fn funding_enforces_policy_and_self_funding_rules() {
    let fixture = setup();
    let request_id = post_request(&fixture);

    fixture.client.set_lender_policy(
        &fixture.lender,
        &LenderPolicy {
            lender: fixture.lender.clone(),
            enabled: true,
            max_single_loan_amount: BORROW_AMOUNT - 1,
            max_total_exposure: BORROW_AMOUNT * 2,
            min_reputation_score: 0,
            min_fee_bps: 200,
            max_duration_seconds: 60,
            allow_repeat_borrower: true,
        },
    );
    let blocked_by_policy = fixture
        .client
        .try_fund_loan_request(&fixture.lender, &request_id);
    assert_eq!(blocked_by_policy, Err(Ok(Error::PolicyMismatch)));

    fixture.client.register_agent(
        &fixture.borrower,
        &String::from_str(&fixture.env, "Borrower-Lender Agent"),
        &AgentRole::Both,
        &hash(&fixture.env, 8),
    );
    fixture.client.set_lender_policy(
        &fixture.borrower,
        &LenderPolicy {
            lender: fixture.borrower.clone(),
            enabled: true,
            max_single_loan_amount: BORROW_AMOUNT,
            max_total_exposure: BORROW_AMOUNT,
            min_reputation_score: 0,
            min_fee_bps: 200,
            max_duration_seconds: 60,
            allow_repeat_borrower: true,
        },
    );
    let self_funding = fixture
        .client
        .try_fund_loan_request(&fixture.borrower, &request_id);
    assert_eq!(self_funding, Err(Ok(Error::CannotFundOwnRequest)));
}

#[test]
fn late_repayment_uses_capped_fee_and_penalizes_reputation() {
    let fixture = setup();
    let request_id = post_request(&fixture);
    let loan_id = fixture
        .client
        .fund_loan_request(&fixture.lender, &request_id);

    fixture.env.ledger().set_timestamp(1_090);
    assert_eq!(fixture.client.current_amount_due(&loan_id), 1_050);
    fixture.client.repay_loan(&fixture.borrower, &loan_id);

    let reputation = fixture.client.get_reputation(&fixture.borrower);
    assert_eq!(reputation.score, 43);
    assert_eq!(reputation.successful_repayments, 0);
    assert_eq!(reputation.late_repayments, 1);
    assert_eq!(reputation.current_credit_limit, 2_000);
}

#[test]
fn admin_can_mark_default_only_after_threshold() {
    let fixture = setup();
    let request_id = post_request(&fixture);
    let loan_id = fixture
        .client
        .fund_loan_request(&fixture.lender, &request_id);

    fixture.env.ledger().set_timestamp(1_044);
    let too_early = fixture.client.try_mark_defaulted(&fixture.admin, &loan_id);
    assert_eq!(too_early, Err(Ok(Error::TooEarlyToDefault)));

    fixture.env.ledger().set_timestamp(1_045);
    fixture.client.mark_defaulted(&fixture.admin, &loan_id);

    let loan = fixture.client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.status, LoanStatus::Defaulted);
    assert_eq!(fixture.client.list_active_loan_ids().len(), 0);

    let reputation = fixture.client.get_reputation(&fixture.borrower);
    assert_eq!(reputation.score, 30);
    assert_eq!(reputation.defaults, 1);
    assert_eq!(reputation.open_borrowed_amount, 0);
}
