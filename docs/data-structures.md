# Soroban Data Structures

This draft defines the first contract data model for ClawLoan. It is intentionally focused on the MVP: agent wallets, lending requests, funded loans, time-based repayment fees, investment policies, and simple reputation-gated borrowing.

The structures below are written in Rust-like Soroban terms, but this is still a design document. Field names and exact types can change once the contract implementation starts.

## Core Assumptions

- Each agent is represented by a Stellar `Address`.
- XLM is handled through the Stellar Asset Contract for native XLM.
- Amounts are stored as `i128`, matching Soroban token contract conventions.
- Time-based fees use ledger timestamps in seconds.
- The first MVP is unsecured micro-lending: no collateral data structure is required.
- The privacy MVP starts with purpose commitments and reputation proof references. It does not claim to hide public token transfers or public contract counterparties.

## Storage Keys

```rust
#[contracttype]
pub enum DataKey {
    Config,
    Agent(Address),
    AgentPolicy(Address),
    AgentReputation(Address),
    Request(u64),
    Loan(u64),
    RequestCounter,
    LoanCounter,
    ActiveRequestIds,
    AgentRequestIds(Address),
    AgentLoanIds(Address),
}
```

### Notes

- `Config` stores global contract settings.
- `Agent(Address)` stores the public agent profile.
- `AgentPolicy(Address)` stores lender-side guardrails for autonomous investment.
- `AgentReputation(Address)` stores borrower repayment stats.
- `Request(u64)` stores an open or closed lending request.
- `Loan(u64)` stores the lifecycle of a funded request.
- `ActiveRequestIds`, `AgentRequestIds`, and `AgentLoanIds` are useful for the MVP UI. If they become too large later, indexing can move offchain through events.

## Config

```rust
#[contracttype]
pub struct Config {
    pub admin: Address,
    pub xlm_token: Address,
    pub min_request_amount: i128,
    pub max_request_amount: i128,
    pub default_starting_credit_limit: i128,
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

## Investment Policy

```rust
#[contracttype]
pub struct InvestmentPolicy {
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

This is the core Agentic track structure. It gives each lender agent a policy that its investment heartbeat can apply before funding a request.

Key product meaning:

- `max_single_loan_amount`: largest request this agent may fund.
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

## Lending Request

```rust
#[contracttype]
pub struct LendingRequest {
    pub id: u64,
    pub borrower: Address,
    pub amount: i128,
    pub fee_model: FeeModel,
    pub min_lender_reputation: u32,
    pub purpose_hash: BytesN<32>,
    pub privacy_mode: PrivacyMode,
    pub reputation_proof: Option<ReputationProofRef>,
    pub status: RequestStatus,
    pub created_at: u64,
    pub funded_loan_id: Option<u64>,
}

#[contracttype]
pub enum RequestStatus {
    Open,
    Funded,
    Cancelled,
    Expired,
}
```

A lending request describes what the borrower wants and how the lender can earn a fee if the borrower repays. It does not store long purpose text directly. The UI can show purpose text from offchain data and use `purpose_hash` as the verifiable reference.

`min_lender_reputation` is optional product depth and can be omitted from the first implementation if it does not serve the demo.

## Loan

```rust
#[contracttype]
pub struct Loan {
    pub id: u64,
    pub request_id: u64,
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
    Late,
    Defaulted,
}
```

The current amount due is derived from:

```text
principal + time_based_fee(principal, fee_model, funded_at, current_time)
```

The contract does not need to store an exact deadline. The loan can remain active while the repayment amount grows up to the configured cap. Reputation is affected by how long repayment takes and whether repayment happens at all.

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

- New agents start with a small `current_credit_limit`.
- Successful repayment increases `score` and may increase `current_credit_limit`.
- Late repayment increases `late_repayments` and may reduce future access.
- Missing repayment increases `defaults` and can block borrowing.
- Lender investment policies can require a minimum `score`.

This supports the trust story without requiring collateral or an external trust-score protocol.

## Privacy Mode

Soroban contract storage is public. The MVP privacy mode must not claim to hide borrower or lender addresses while the public request and loan records store those addresses. Private settlement and hidden counterparties are future work, not part of the first contract model.

```rust
#[contracttype]
pub struct PrivacyMode {
    pub hide_purpose: bool,
    pub require_reputation_proof: bool,
}

#[contracttype]
pub struct ReputationProofRef {
    pub proof_hash: BytesN<32>,
    pub statement_hash: BytesN<32>,
    pub nonce: BytesN<32>,
    pub expires_at: u64,
}
```

This is a placeholder for the privacy track, not a full privacy implementation. It gives the product a place to express selective disclosure for purpose and reputation.

For the MVP, the contract can keep public fields where required and use hashes or proof references for sensitive context. The pitch can explain the intended direction: agents reveal enough to evaluate and settle a loan, while avoiding unnecessary disclosure of wallet balance, strategy, purpose, or full repayment history.

`ReputationProofRef` supports the selective reputation privacy story. In the MVP, it should point to a signed eligibility attestation or an offchain proof artifact. `statement_hash` binds the proof to a narrow claim, such as "borrower credit limit is high enough and defaults are below the lender threshold." `nonce` and `expires_at` prevent stale proof reuse. A true onchain ZK verifier is stretch work, not required for the MVP.

## Events

Events should make the landing page, skill logs, and demo easy to follow.

```rust
AgentRegistered {
    agent: Address,
}

PolicyUpdated {
    lender: Address,
}

RequestPosted {
    request_id: u64,
    borrower: Address,
    amount: i128,
}

RequestFunded {
    request_id: u64,
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

The data model implies these contract actions:

- Register or update an agent profile.
- Set a lender investment policy.
- Post a lending request.
- Cancel an open request.
- Fund an open request.
- Calculate the current repayment amount for a loan.
- Repay an active loan.
- Read agent reputation.
- Read open requests and loan status for the UI.

The first implementation should avoid advanced matching, auctions, collateral, external trust scoring, or complex risk pricing. The data model should prove the central story: agents can request XLM, autonomously lend XLM under a policy, repay with a time-based fee, and build reputation from repayment behavior.
