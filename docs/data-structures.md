# Soroban Data Structures

This draft defines the first contract data model for ClawLoan. It is intentionally focused on the MVP: agent wallets, Loan Requests, funded loans, time-based repayment fees, Lender Policies, and simple reputation-gated borrowing.

The structures below are written in Rust-like Soroban terms, but this is still a design document. Field names and exact types can change once the contract implementation starts.

## Core Assumptions

- Each agent is represented by a Stellar `Address`.
- XLM is handled through the Stellar Asset Contract for native XLM.
- Amounts are stored as `i128`, matching Soroban token contract conventions.
- Time-based fees use ledger timestamps in seconds.
- The first MVP is unsecured micro-lending: no collateral data structure is required.
- The privacy MVP starts with purpose commitments, reputation roots, proof nullifiers, and Eligibility Proof references. It does not claim to hide public token transfers or public contract counterparties.

## Storage Keys

```rust
#[contracttype]
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
```

### Notes

- `Config` stores global contract settings.
- `Agent(Address)` stores the public agent profile.
- `LenderPolicy(Address)` stores lender-side guardrails for autonomous investment.
- `AgentReputation(Address)` stores borrower repayment stats.
- `NetworkStats` stores simple aggregate stats for the landing page.
- `LoanRequest(u64)` stores an open or closed Loan Request.
- `Loan(u64)` stores the lifecycle of a funded Loan Request.
- `ActiveLoanRequestIds`, `ActiveLoanIds`, `AgentLoanRequestIds`, and `AgentLoanIds` are useful for the MVP UI. If they become too large later, indexing can move offchain through events.

## Config

```rust
#[contracttype]
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
```

`Config` defines the shared rules of the marketplace. The important product choice is `default_starting_credit_limit`: new agents can borrow only a small amount until they build repayment history.

## Agent Profile

```rust
#[contracttype]
pub struct AgentProfile {
    pub address: Address,
    pub display_name: String,
    pub role: AgentRole,
    pub created_at: u64,
    pub status: AgentStatus,
    pub public_metadata_hash: BytesN<32>,
}

#[contracttype]
pub enum AgentRole {
    Borrower,
    Lender,
    Both,
}

#[contracttype]
pub enum AgentStatus {
    Active,
    Suspended,
}
```

`public_metadata_hash` can point to offchain agent context without forcing the contract to store long text. For the skill and landing-page UI, the readable name and narrative can live offchain while the contract stores only the verifiable reference.

## Lender Policy

```rust
#[contracttype]
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
```

This is the core Agentic track structure. It gives each Lender Agent a Lender Policy that its Investment Heartbeat can apply before funding a Loan Request.

Key product meaning:

- `max_single_loan_amount`: largest Loan Request this agent may fund.
- `max_total_exposure`: total currently open loans this agent may carry.
- `min_reputation_score`: minimum borrower reputation before the agent will lend.
- `min_fee_bps`: minimum acceptable fee return.
- `max_duration_seconds`: maximum time window the agent is willing to tolerate before reputation penalties become relevant.

## Fee Model

```rust
#[contracttype]
pub struct FeeModel {
    pub base_fee_bps: u32,
    pub step_fee_bps: u32,
    pub step_seconds: u64,
    pub max_fee_bps: u32,
}
```

The MVP should use a tiered time-based fee. The borrower pays a base fee, and the fee increases every `step_seconds` while the loan remains open.

Example:

- Borrow `10 XLM`.
- `base_fee_bps = 200`, so quick repayment is `10.2 XLM`.
- `step_fee_bps = 100`, so every step adds another `0.1 XLM`.
- `max_fee_bps` prevents the repayment amount from growing without bound.

## Loan Request

```rust
#[contracttype]
pub struct LoanRequest {
    pub id: u64,
    pub borrower: Address,
    pub amount: i128,
    pub fee_model: FeeModel,
    pub purpose_hash: BytesN<32>,
    pub privacy_mode: PrivacyMode,
    pub eligibility_proof: PrivacyProof,
    pub status: LoanRequestStatus,
    pub created_at: u64,
    pub funded_loan_id: Option<u64>,
}

#[contracttype]
pub enum LoanRequestStatus {
    Open,
    Funded,
    Cancelled,
    Expired,
}
```

A Loan Request describes what the borrower wants and how the lender can earn a fee if the borrower repays. It does not store long purpose text directly. The UI can show purpose text from offchain data and use `purpose_hash` as the verifiable reference.

## Loan

```rust
#[contracttype]
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
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
}
```

The current amount due is derived from:

```text
principal + time_based_fee(principal, fee_model, funded_at, current_time)
```

The contract does not need to store an exact deadline. The loan can remain active while the repayment amount grows up to the configured cap. Late repayment is derived from `funded_at + late_threshold_seconds` and affects reputation when `repay_loan` runs. Missing repayment can be recorded through the admin-only `mark_defaulted` recovery function.

## Reputation

```rust
#[contracttype]
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
```

The first reputation model should stay simple:

- New agents start with `score = 50` and `current_credit_limit = default_starting_credit_limit`.
- Posting a Loan Request fails if `open_borrowed_amount + amount > current_credit_limit`.
- Funding a Loan Request increases `open_borrowed_amount` by principal.
- Repayment decreases `open_borrowed_amount` by principal and updates totals.
- Repayment before `late_threshold_seconds` increases `successful_repayments`, applies `reputation_success_increment`, and can increase `current_credit_limit` by the principal up to `max_request_amount`.
- Repayment at or after `late_threshold_seconds` increases `late_repayments`, applies `reputation_late_penalty`, and does not increase credit limit.
- `mark_defaulted` increases `defaults`, applies `reputation_default_penalty`, and sets the loan status to `Defaulted`.
- Lender Policies can require a minimum `score`.

This supports the trust story without requiring collateral or an external trust-score protocol.

## Network Stats

```rust
#[contracttype]
pub struct NetworkStats {
    pub loan_requests_posted: u64,
    pub loans_funded: u64,
    pub loans_repaid: u64,
    pub total_xlm_lent: i128,
    pub total_fees_paid: i128,
    pub total_repayment_seconds: u64,
}
```

`NetworkStats` gives the landing page direct contract-backed numbers without requiring an event indexer for the first build. Average repayment time is derived as:

```text
total_repayment_seconds / loans_repaid
```

The Loan Requests Over Time chart still requires indexed events. If no event indexer exists, the frontend should hide that chart or label it unavailable.

## Privacy Mode

Soroban contract storage is public. The MVP privacy mode must not claim to hide borrower or lender addresses while the public request and loan records store those addresses. Private settlement and hidden counterparties are future work, not part of the first contract model.

```rust
#[contracttype]
pub struct PrivacyMode {
    pub hide_purpose: bool,
    pub require_proof: bool,
}

#[contracttype]
pub enum PrivacyProof {
    None,
    Present(EligibilityProof),
}

#[contracttype]
pub struct EligibilityProof {
    pub proof_hash: BytesN<32>,
    pub public_inputs_hash: BytesN<32>,
    pub reputation_root: BytesN<32>,
    pub nullifier_hash: BytesN<32>,
    pub verifier: Address,
    pub expires_at: u64,
}
```

This is a proof reference, not a UI-hiding mechanism. `public_inputs_hash` binds the policy statement, `reputation_root` commits to the private witness, and `nullifier_hash` prevents replay.

For the MVP, the contract can keep public fields where required and use hashes or Eligibility Proofs for sensitive context. Privacy exists only for values kept out of public state/events and proven inside a cryptographic witness.

`EligibilityProof` supports the privacy story. It points to a Groth16/BLS12-381 proof and verifier receipt for a narrow claim, such as "borrower credit limit is high enough and defaults are below the lender threshold." `public_inputs_hash`, `reputation_root`, `nullifier_hash`, `verifier`, and `expires_at` make proof binding and replay protection explicit.

## Events

Events should make the landing page, skill logs, and demo easy to follow.

```rust
AgentRegistered {
    agent: Address,
}

PolicyUpdated {
    lender: Address,
}

LoanRequestPosted {
    loan_request_id: u64,
    borrower: Address,
    amount: i128,
}

LoanRequestFunded {
    loan_request_id: u64,
    loan_id: u64,
    lender: Address,
}

LoanRepaid {
    loan_id: u64,
    borrower: Address,
    lender: Address,
    amount_repaid: i128,
}

ReputationUpdated {
    agent: Address,
    score: u32,
    credit_limit: i128,
}
```

## First MVP Functions Implied By These Structures

The first contract should expose these actions:

```rust
pub fn __constructor(env: Env, config: Config);

pub fn register_agent(
    env: Env,
    agent: Address,
    display_name: String,
    role: AgentRole,
    public_metadata_hash: BytesN<32>,
);

pub fn set_lender_policy(env: Env, lender: Address, policy: LenderPolicy);

pub fn post_loan_request(
    env: Env,
    borrower: Address,
    amount: i128,
    fee_model: FeeModel,
    purpose_hash: BytesN<32>,
    privacy_mode: PrivacyMode,
    eligibility_proof: PrivacyProof,
) -> u64;

pub fn cancel_loan_request(env: Env, borrower: Address, loan_request_id: u64);
pub fn fund_loan_request(env: Env, lender: Address, loan_request_id: u64) -> u64;
pub fn current_amount_due(env: Env, loan_id: u64) -> i128;
pub fn repay_loan(env: Env, borrower: Address, loan_id: u64);
pub fn mark_defaulted(env: Env, admin: Address, loan_id: u64);

pub fn get_config(env: Env) -> Config;
pub fn get_agent(env: Env, agent: Address) -> Option<AgentProfile>;
pub fn get_lender_policy(env: Env, lender: Address) -> Option<LenderPolicy>;
pub fn get_reputation(env: Env, agent: Address) -> Reputation;
pub fn get_network_stats(env: Env) -> NetworkStats;
pub fn get_loan_request(env: Env, loan_request_id: u64) -> Option<LoanRequest>;
pub fn get_loan(env: Env, loan_id: u64) -> Option<Loan>;
pub fn list_open_loan_request_ids(env: Env) -> Vec<u64>;
pub fn list_active_loan_ids(env: Env) -> Vec<u64>;
pub fn list_agent_loan_request_ids(env: Env, agent: Address) -> Vec<u64>;
pub fn list_agent_loan_ids(env: Env, agent: Address) -> Vec<u64>;
```

## Authorization Rules

- `register_agent`: `agent.require_auth()`.
- `set_lender_policy`: `lender.require_auth()`.
- `post_loan_request`: `borrower.require_auth()`.
- `cancel_loan_request`: borrower must own the Loan Request and call `borrower.require_auth()`.
- `fund_loan_request`: `lender.require_auth()`.
- `repay_loan`: borrower must own the Loan and call `borrower.require_auth()`.
- `mark_defaulted`: admin-only.

## Error Cases

```rust
#[contracterror]
pub enum Error {
    AlreadyInitialized = 1,
    NotAuthorized = 2,
    AgentNotFound = 3,
    LoanRequestNotFound = 4,
    LoanNotFound = 5,
    InvalidAmount = 6,
    InvalidFeeModel = 7,
    CreditLimitExceeded = 8,
    LoanRequestNotOpen = 9,
    CannotFundOwnRequest = 10,
    PolicyDisabled = 11,
    PolicyRejected = 12,
    LoanNotActive = 13,
    RepaymentInsufficient = 14,
    TooEarlyToDefault = 15,
}
```

The first implementation should avoid advanced matching, auctions, collateral, external trust scoring, or complex risk pricing. The data model should prove the central story: agents can request XLM, autonomously lend XLM under a policy, repay with a time-based fee, and build reputation from repayment behavior.
