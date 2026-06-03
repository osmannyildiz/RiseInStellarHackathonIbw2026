# MVP Build Spec

This is the implementation source of truth for the first ClawLoan build. It resolves the remaining product choices so contract, skill, automation, and frontend work can start without re-litigating scope.

## First Implementation Scope

Build these pieces first:

1. Soroban contract replacing the current hello-world contract.
2. Testnet helper scripts for setup, known-good flow, and recovery.
3. Unified ClawLoan skill that calls those helper scripts.
4. Landing page that explains the skill and reads contract-backed stats.

Do not build these in the first implementation pass:

- collateral;
- auctions or lender matching;
- complex risk pricing;
- onchain ZK verification;
- private settlement;
- production credit scoring;
- multi-runtime agent support beyond hands-on validation.

## Resolved MVP Decisions

| Decision | Choice |
| --- | --- |
| Asset | Native XLM through the Stellar Asset Contract. |
| Loan type | Unsecured micro-loan. |
| Repayment timing | No hard deadline. Fee grows by time step until capped. |
| Default handling | No automatic default in the first contract. Admin can mark an active loan defaulted after `late_threshold_seconds`. |
| Privacy MVP | Eligibility Attestation reference stored on the Loan Request; signed statement verified offchain by the lender skill/helper before funding. |
| Attestation issuer | Local reputation helper script for the first implementation. A dedicated reputation agent is future work. |
| Borrower repayment | Operator-triggered borrower-agent action for the first implementation. Do not auto-repay without an explicit agent/operator step. |
| Heartbeat logic | Deterministic policy filter first. Agent-generated explanation is allowed only after the policy result is computed. |
| Target agents | Validate OpenClaw first; add Hermes only after the full flow works. PicoClaw remains stretch. |
| Frontend stats | Start with direct contract reads for current counts and totals. Add event indexing only for time-series charts. |

## Default Testnet Values

Use small, visible values:

| Value | Default |
| --- | --- |
| Borrower reserve | `2 XLM` |
| Lender reserve | `15 XLM` |
| Loan Request amount | `10 XLM` |
| Starting credit limit | `20 XLM` |
| Max single loan | `10 XLM` |
| Max total exposure | `20 XLM` |
| Minimum reputation score | `0` for first run, then `50` when attestation flow is enabled. |
| Base fee | `200 bps` |
| Step fee | `100 bps` |
| Step seconds | `15` |
| Max fee | `500 bps` |
| Late threshold | `45 seconds` for demo/testnet scoring. |

These values are for testnet and demos only. They are intentionally short so the full lifecycle can complete quickly.

## Contract API

The first contract should expose these functions. Names can be idiomatic Rust/Soroban snake_case, but the meaning should stay fixed.

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
    eligibility_attestation: Option<EligibilityAttestation>,
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
- `cancel_loan_request`: borrower must be the Loan Request borrower and call `borrower.require_auth()`.
- `fund_loan_request`: `lender.require_auth()`; lender cannot fund its own Loan Request unless a test-only flag is added outside the MVP contract.
- `repay_loan`: borrower must be the Loan borrower and call `borrower.require_auth()`.
- `mark_defaulted`: admin-only recovery/scoring function; fails before `late_threshold_seconds`.

## Token Movement

- `fund_loan_request` transfers principal XLM from lender to borrower.
- `repay_loan` transfers `current_amount_due` from borrower to lender.
- The contract does not escrow XLM after funding.
- Repayment is not guaranteed; reputation and future credit limits are the enforcement mechanism.

## Reputation Rules

Start simple:

- New agents receive `score = 50`, `current_credit_limit = default_starting_credit_limit`, and zero counts.
- Posting a Loan Request must fail if `open_borrowed_amount + amount > current_credit_limit`.
- Funding a Loan Request increments borrower `open_borrowed_amount` by principal.
- Repayment decrements `open_borrowed_amount` by principal and increments totals.
- Repayment before `late_threshold_seconds` increments `successful_repayments`, increases score by `reputation_success_increment`, and can increase credit limit by the principal up to `max_request_amount`.
- Repayment at or after `late_threshold_seconds` increments `late_repayments`, applies `reputation_late_penalty`, and does not increase credit limit.
- `mark_defaulted` can run only after `late_threshold_seconds`. It increments `defaults`, applies `reputation_default_penalty`, sets loan status to `Defaulted`, and leaves repayment risk visible.

## Network Stats

Maintain `NetworkStats` onchain for landing-page reads:

- Increment `loan_requests_posted` when a Loan Request is posted.
- Increment `loans_funded` and add to `total_xlm_lent` when a Loan Request is funded.
- Increment `loans_repaid`, add to `total_fees_paid`, and add to `total_repayment_seconds` when a Loan is repaid.
- Derive average repayment time as `total_repayment_seconds / loans_repaid`.

The Loan Requests Over Time chart is not part of direct contract stats. It needs event indexing and should be hidden until `rebuild-stats` implements it.

## Fee Calculation

Use integer basis points:

```text
elapsed = now - funded_at
steps = elapsed / step_seconds
fee_bps = min(base_fee_bps + steps * step_fee_bps, max_fee_bps)
amount_due = principal + principal * fee_bps / 10_000
```

Reject `FeeModel` values where:

- `base_fee_bps > max_fee_bps`;
- `step_seconds == 0`;
- `max_fee_bps > 10_000`;
- `amount <= 0`.

## Eligibility Attestation

The MVP does not verify attestation signatures onchain.

The local reputation helper script should:

1. Read testnet contract state or indexed events.
2. Build a statement with borrower address, Loan Request id or pending nonce, requested amount, minimum score, maximum defaults, expiration, and nonce.
3. Hash the statement into `statement_hash`.
4. Sign or record the statement offchain.
5. Provide an `EligibilityAttestation` reference with `attestation_hash`, `statement_hash`, `issuer`, `nonce`, and `expires_at`.

The lender helper/skill verifies the signed statement before calling `fund_loan_request`.

## Helper Scripts

Implement small scripts or commands with these names:

- `setup-testnet-accounts`: create/load borrower, lender, and attestation issuer testnet identities.
- `deploy-contract`: build, deploy, and write contract config.
- `configure-demo`: write contract ID, token address, agent IDs, and defaults into generated skill/frontend config.
- `post-demo-loan-request`: register borrower if needed and post a known-good Loan Request.
- `run-lender-heartbeat-once`: read open Loan Requests, apply Lender Policy, verify attestation if required, and fund the best eligible request.
- `repay-demo-loan`: repay the active loan from the borrower wallet.
- `rebuild-stats`: read `get_network_stats`, open Loan Requests, active loans, and, if event indexing exists, rebuild indexed event summaries.
- `recover-demo`: list open Loan Requests and active loans, then suggest cancel/repay/default recovery steps.

## Frontend Data

The first frontend should display:

- install instructions for the ClawLoan skill;
- example borrower and lender prompts;
- current contract ID and testnet label;
- Open Loan Requests from `list_open_loan_request_ids`;
- Loan Requests Posted from `get_network_stats`;
- Loans Funded from `get_network_stats`;
- Loans Repaid from `get_network_stats`;
- Total XLM Lent from `get_network_stats`;
- Total Fees Paid from `get_network_stats`;
- Average Repayment Time from `get_network_stats` when `loans_repaid > 0`;
- Loan Requests Over Time only if the event indexer exists.

If a stat is not implemented yet, hide it or label it unavailable. Do not show invented values.

## Ready-To-Implement Checklist

Implementation can start when these docs exist and agree:

- `docs/mvp-build-spec.md` defines exact MVP behavior.
- `docs/data-structures.md` matches the contract API and data model.
- `docs/skill-interface.md` points agents to helper scripts instead of vague actions.
- `docs/testnet-runbook.md` names the setup, flow, and recovery commands.
- `docs/plan.md` has no unresolved product questions that block Phase 1.
