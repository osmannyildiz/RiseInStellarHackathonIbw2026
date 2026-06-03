use soroban_sdk::{contracttype, Address, BytesN, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Config,
    Agent(Address),
    LenderPolicy(Address),
    AgentReputation(Address),
    NetworkStats,
    LoanRequest(u64),
    Loan(u64),
    LoanRequestCounter,
    LoanCounter,
    ActiveLoanRequestIds,
    ActiveLoanIds,
    AgentLoanRequestIds(Address),
    AgentLoanIds(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub xlm_token: Address,
    pub min_request_amount: i128,
    pub max_request_amount: i128,
    pub default_starting_credit_limit: i128,
    pub late_threshold_seconds: u64,
    pub reputation_success_increment: u32,
    pub reputation_late_penalty: u32,
    pub reputation_default_penalty: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AgentProfile {
    pub address: Address,
    pub display_name: String,
    pub role: AgentRole,
    pub created_at: u64,
    pub status: AgentStatus,
    pub public_metadata_hash: BytesN<32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AgentRole {
    Borrower,
    Lender,
    Both,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AgentStatus {
    Active,
    Suspended,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LenderPolicy {
    pub lender: Address,
    pub enabled: bool,
    pub max_single_loan_amount: i128,
    pub max_total_exposure: i128,
    pub min_reputation_score: u32,
    pub min_fee_bps: u32,
    pub max_duration_seconds: u64,
    pub allow_repeat_borrower: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeModel {
    pub base_fee_bps: u32,
    pub step_fee_bps: u32,
    pub step_seconds: u64,
    pub max_fee_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanRequest {
    pub id: u64,
    pub borrower: Address,
    pub amount: i128,
    pub fee_model: FeeModel,
    pub purpose_hash: BytesN<32>,
    pub privacy_mode: PrivacyMode,
    pub eligibility_attestation: Attestation,
    pub status: LoanRequestStatus,
    pub created_at: u64,
    pub funded_loan_id: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanRequestStatus {
    Open,
    Funded,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub id: u64,
    pub loan_request_id: u64,
    pub borrower: Address,
    pub lender: Address,
    pub principal: i128,
    pub fee_model: FeeModel,
    pub funded_at: u64,
    pub repaid_at: Option<u64>,
    pub amount_repaid: i128,
    pub status: LoanStatus,
    pub privacy_mode: PrivacyMode,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reputation {
    pub agent: Address,
    pub score: u32,
    pub successful_repayments: u32,
    pub late_repayments: u32,
    pub defaults: u32,
    pub total_borrowed: i128,
    pub total_repaid: i128,
    pub current_credit_limit: i128,
    pub open_borrowed_amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NetworkStats {
    pub loan_requests_posted: u64,
    pub loans_funded: u64,
    pub loans_repaid: u64,
    pub total_xlm_lent: i128,
    pub total_fees_paid: i128,
    pub total_repayment_seconds: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PrivacyMode {
    pub hide_purpose: bool,
    pub require_attestation: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Attestation {
    None,
    Present(EligibilityAttestation),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EligibilityAttestation {
    pub attestation_hash: BytesN<32>,
    pub statement_hash: BytesN<32>,
    pub issuer: Address,
    pub nonce: BytesN<32>,
    pub expires_at: u64,
}
