# Testnet Runbook And Automation

ClawLoan should run as a Stellar testnet MVP. Presentation preparation should focus on automation, repeatability, and recovery, not simulated behavior.

## Goals

- Run the full loan lifecycle on Stellar testnet.
- Keep agent wallets, contract IDs, and skill references in sync.
- Make the live run repeatable with minimal manual steps.
- Recover cleanly when a transaction, agent action, or index step fails.
- Keep every visible statistic tied to contract state or real testnet events.

## Locked Demo Profile

Use this profile for the first live run:

| Item | Value |
| --- | --- |
| Network | Stellar testnet |
| Asset | Native XLM through the Stellar Asset Contract |
| Borrower Agent | One configured testnet identity |
| Lender Agent | One separate configured testnet identity |
| Attestation issuer | Local reputation helper identity |
| Loan Request amount | `10 XLM` |
| Borrower reserve | `2 XLM` |
| Lender reserve | `15 XLM` |
| Starting credit limit | `20 XLM` |
| Max single loan | `10 XLM` |
| Max total exposure | `20 XLM` |
| First-run minimum reputation | `0` |
| Privacy-run minimum reputation | `50` |
| Base fee | `200 bps` |
| Step fee | `100 bps` every `15 seconds` |
| Max fee | `500 bps` |
| Late threshold | `45 seconds` |

The first happy path can run without requiring an Eligibility Attestation so a fresh borrower is not blocked. The privacy run turns on `require_eligibility_attestation` and verifies the signed statement offchain before funding.

## Required Automation

### Account Setup

Command: `setup-testnet-accounts`

- create or load borrower and lender testnet accounts;
- fund accounts from Friendbot or another testnet funding source;
- verify balances;
- write wallet identifiers into skill reference config;
- never write mainnet credentials into testnet config.

### Contract Deployment

Command: `deploy-contract`

- build the Soroban contract;
- deploy to testnet;
- initialize contract config;
- store contract ID and token address in a generated config file;
- update skill references and frontend environment values.

Command: `configure-demo`

- write contract ID, token address, agent IDs, default fee model, and testnet values into generated config;
- update the skill references and frontend environment values from the same source.

### Known-Good Flow

Commands: `post-demo-loan-request`, `run-lender-heartbeat-once`, `repay-demo-loan`

- register borrower and lender agents;
- set the Lender Agent's Lender Policy;
- post a small Loan Request;
- run one lender heartbeat;
- fund the Loan Request if policy matches;
- calculate current amount due;
- repay the loan;
- verify reputation and loan status.

### Local Indexing

If the landing page needs charts that are hard to build from direct contract reads, use a local event indexer.

Command: `rebuild-stats`

Rules:

- index only real testnet transactions or contract events;
- store indexed data separately from contract state;
- label indexed data as indexed testnet activity;
- provide a rebuild command so stale data can be refreshed;
- never use invented static values as live network stats.

### Recovery Commands

Provide commands for:

- checking current contract config;
- listing open Loan Requests;
- listing active loans;
- cancelling stale open Loan Requests;
- repaying an active loan;
- rebuilding the local event index;
- switching the frontend to a fresh contract deployment;
- resetting testnet run state when needed.

Command: `recover-demo`

## Happy Path Runbook

Run this sequence before the live presentation and again during the demo if time allows.

| Step | Command or action | Expected output | Recovery |
| --- | --- | --- | --- |
| 1 | `setup-testnet-accounts` | Borrower, lender, and attestation issuer identities exist; borrower balance is above `2 XLM`; lender balance is above `25 XLM`. | Re-run Friendbot funding if available. If funding is rate-limited, switch to pre-funded testnet identities. |
| 2 | `deploy-contract` | Contract builds, deploys to testnet, initializes config, and writes contract ID plus native token address to generated config. | If build fails, fix contract errors. If deploy fails or config is wrong, deploy a fresh contract and run `configure-demo`. |
| 3 | `configure-demo` | Skill references and frontend environment point to the same contract ID, token address, agent addresses, fee model, and limits. | Re-run `configure-demo`; do not manually copy contract IDs into multiple files during the live run. |
| 4 | `rebuild-stats` | Direct contract stats load; indexed charts are either populated from real events or marked unavailable. | If indexing fails, hide `Loan Requests Over Time` and continue with direct contract stats. |
| 5 | Open landing page | Page shows skill install instructions, testnet label, current contract ID, and available contract-backed stats. | Refresh config and rebuild frontend. If stats are unavailable, show contract ID and proceed with skill-led flow. |
| 6 | Borrower prompt: "Use ClawLoan to check my XLM balance and post a 10 XLM Loan Request." | Agent reports balance, confirms credit limit, and calls `post-demo-loan-request`; output includes Loan Request id and status `Open`. | If balance is low, fund borrower. If credit limit is exhausted, cancel stale requests or repay/default active loans through `recover-demo`. |
| 7 | Lender prompt: "Run one ClawLoan Investment Heartbeat." | Agent reports balance, reserve, available-to-lend amount, best Loan Request, policy checks, and a fund/wait decision. | If decision is `wait`, inspect the policy mismatch. Fix only demo config or post a new known-good request; do not bypass policy silently. |
| 8 | `run-lender-heartbeat-once` funds the eligible request | Output includes funding transaction hash, Loan id, borrower, lender, principal, and status `Active`. | If funding fails, run `recover-demo`; retry only if the Loan Request is still `Open` and lender exposure remains within policy. |
| 9 | Borrower prompt: "Repay my active ClawLoan loan now." | Agent calls `repay-demo-loan`; output includes current amount due, repayment transaction hash, fee paid, and status `Repaid`. | If repayment balance is low, fund borrower testnet wallet enough to cover due amount. If the loan is stale, repay anyway or use `mark_defaulted` only after threshold for recovery/scoring demos. |
| 10 | Refresh landing page or run `rebuild-stats` | `Loans Funded`, `Loans Repaid`, `Total XLM Lent`, `Total Fees Paid`, and average repayment time reflect the contract state. | If direct stats mismatch, read `get_network_stats` directly. If indexed charts lag, label them unavailable and keep direct stats visible. |

## Privacy Runbook Add-On

After the plain happy path works:

1. Set Lender Policy `min_reputation_score = 50` and `require_eligibility_attestation = true`.
2. Generate a signed Eligibility Attestation statement for the borrower with the local reputation helper.
3. Post a new Loan Request with `PrivacyMode.require_eligibility_attestation = true`.
4. Run `run-lender-heartbeat-once`.
5. Expected output: the heartbeat verifies the attestation offchain, reports that the borrower is eligible, and funds only if the statement is unexpired, nonce-bound, and policy-compatible.

Privacy recovery:

- If attestation verification fails, regenerate the statement with the current Loan Request id or nonce.
- If the statement expired, issue a fresh attestation.
- If the borrower reputation is below threshold, run the first happy path repayment or lower the threshold only for the first-run demo profile.

## Recovery Matrix

| Problem | How to detect | Recovery command or action |
| --- | --- | --- |
| Wrong contract ID in skill or frontend | Skill output and landing page show different contract IDs. | Run `configure-demo` from the generated deployment config. |
| Stale open Loan Request | `recover-demo` lists old requests with status `Open`. | Cancel borrower-owned requests, or deploy/configure a fresh contract if cancellation is not available yet. |
| Active loan blocks credit limit | Borrower cannot post because `open_borrowed_amount + amount` exceeds credit limit. | Repay active loan with `repay-demo-loan`; if intentionally abandoned and threshold passed, use admin `mark_defaulted`. |
| Lender will not fund | Heartbeat decision log shows reserve, exposure, fee, reputation, or attestation mismatch. | Adjust only demo policy/config to the locked values, or post a known-good request. |
| Loan Request already funded | `fund_loan_request` fails or request status is `Funded`. | Use the existing Loan id and continue to repayment; do not post duplicate requests unless resetting the run. |
| Repayment amount changed during demo | `current_amount_due` is higher after a fee step. | Repay the current due amount; the increasing fee is expected behavior. |
| Stats page lags | Direct contract read differs from indexed chart. | Prefer direct `get_network_stats`; rerun `rebuild-stats`; hide stale time-series charts. |
| Testnet account is out of XLM | Balance check is below reserve or repayment due. | Re-fund with testnet funding source or switch to pre-funded demo identity. |
| Target agent runtime cannot load skill | Agent fails skill discovery or cannot read references. | Use helper commands directly for the live run and keep target-specific validation as follow-up; do not rewrite the skill for one runtime during the presentation. |

## Target-Agent Setup Gate

Before claiming target-agent support, each runtime must pass the checklist in `docs/agent-targets.md`. As of June 3, 2026, this repository does not include OpenClaw, Hermes, PicoClaw, or `HEARTBEAT.md` runtime files to test locally. The locked Phase 0 decision is therefore:

- build the skill and helpers to be runtime-portable;
- validate OpenClaw first when its runtime is available;
- validate Hermes second after the OpenClaw flow works;
- use two configured agents in one stable runtime for the demo if two separate runtimes are not validated.

## Non-Goals

- Do not depend on mainnet funds.
- Do not fake contract activity for the stats page.
- Do not rely on a single irreversible run with no reset path.
- Do not require manual contract IDs to be copied into multiple files during the live presentation.
