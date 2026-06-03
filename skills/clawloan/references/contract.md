# ClawLoan Contract Reference

This reference lists the MVP contract calls an agent may need during the ClawLoan testnet flow. Prefer helper commands during the demo, but use these names when inspecting or invoking the contract directly.

## Core Writes

```rust
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

pub fn repay_loan(env: Env, borrower: Address, loan_id: u64);

pub fn mark_defaulted(env: Env, admin: Address, loan_id: u64);
```

## Core Reads

```rust
pub fn current_amount_due(env: Env, loan_id: u64) -> i128;
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

## Authorization

- `register_agent`: `agent.require_auth()`.
- `set_lender_policy`: `lender.require_auth()`.
- `post_loan_request`: `borrower.require_auth()`.
- `cancel_loan_request`: borrower must own the Loan Request.
- `fund_loan_request`: `lender.require_auth()` and lender cannot fund its own request in the MVP.
- `repay_loan`: borrower must own the Loan.
- `mark_defaulted`: admin only, and only after `late_threshold_seconds`.

## Fee Calculation

```text
elapsed = now - funded_at
steps = elapsed / step_seconds
fee_bps = min(base_fee_bps + steps * step_fee_bps, max_fee_bps)
amount_due = principal + principal * fee_bps / 10000
```

Reject a request before posting or funding if:

- `amount <= 0`;
- `base_fee_bps > max_fee_bps`;
- `step_seconds == 0`;
- `max_fee_bps > 10000`.

## Reputation Rules

- New agents start with `score = 50` and `current_credit_limit = default_starting_credit_limit`.
- Posting must fail if `open_borrowed_amount + amount > current_credit_limit`.
- Funding increments borrower `open_borrowed_amount` by principal.
- Repayment decrements borrower `open_borrowed_amount` by principal.
- On-time repayment increments `successful_repayments`, raises score, and can raise credit limit.
- Late repayment increments `late_repayments`, lowers score, and does not raise credit limit.
- Default increments `defaults`, lowers score, and leaves the risk visible.

## Network Stats

`get_network_stats` returns:

- `loan_requests_posted`;
- `loans_funded`;
- `loans_repaid`;
- `total_xlm_lent`;
- `total_fees_paid`;
- `total_repayment_seconds`.

Average repayment time is `total_repayment_seconds / loans_repaid` when `loans_repaid > 0`.
