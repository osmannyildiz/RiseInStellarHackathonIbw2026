---
name: clawloan
description: Use ClawLoan on Stellar. Enables AI agents to check XLM balance, post Loan Requests, review open Loan Requests, apply a Lender Policy, fund eligible requests within configured wallet limits, repay loans with time-based fees, and track reputation-gated credit.
user-invocable: true
argument-hint: "[borrow | lend | heartbeat | repay | recover]"
---

# ClawLoan

Use this skill when an agent needs to borrow XLM, lend idle XLM, inspect ClawLoan Loan Requests, run an Investment Heartbeat, manage repayment, or recover a Stellar testnet demo flow.

ClawLoan is a Stellar testnet agent-to-agent lending network. Borrower agents post short-term XLM Loan Requests. Lender agents apply a local Lender Policy, fund eligible requests, and earn a capped time-based repayment fee when the borrower repays.

## First Rules

- Use Stellar testnet only unless the operator explicitly approves a different network.
- Do not use mainnet credentials, mainnet wallet secrets, or production funds.
- Apply deterministic policy checks before writing a natural-language lending explanation.
- Ask the operator before changing wallet configuration, raising exposure limits, using non-testnet credentials, or funding a request that violates any configured safety rule.
- Do not auto-repay without an explicit borrower-agent or operator action.
- Treat Eligibility Attestations as offchain-verified references; the MVP does not claim private settlement or onchain ZK verification.
- Prefer the helper commands in [commands.md](references/commands.md) over ad hoc contract calls during the demo.

## Quick References

- Contract functions and argument meanings: [contract.md](references/contract.md)
- Testnet constants and policy defaults: [demo-values.md](references/demo-values.md)
- Helper and recovery commands: [commands.md](references/commands.md)
- Privacy and attestation limits: [privacy.md](references/privacy.md)
- Target-agent validation notes: [agent-targets.md](references/agent-targets.md)

## Borrower Workflow

Use this flow when the agent needs short-term XLM.

1. Check wallet balance and keep at least the borrower reserve from [demo-values.md](references/demo-values.md).
2. Read borrower reputation, `current_credit_limit`, and `open_borrowed_amount`.
3. Confirm `open_borrowed_amount + requested_amount <= current_credit_limit`.
4. Use the default fee model unless the operator provides a different testnet-safe model.
5. Keep readable purpose text offchain; submit only a `purpose_hash`.
6. For the first run, use `PrivacyMode.require_attestation = false`. For the privacy run, include a valid Eligibility Attestation.
7. Post one Loan Request.
8. Monitor whether the request becomes funded.
9. After funding, check `current_amount_due` before repayment.
10. Repay only after an explicit borrower-agent or operator instruction.
11. Confirm loan status, reputation, and network stats after repayment.

Known-good prompt:

```text
Use ClawLoan to check my XLM balance and post a 10 XLM Loan Request on testnet with the default demo fee model.
```

## Wallet Balance Check

Use this before posting, funding, or repaying.

1. Identify the configured testnet wallet address and role.
2. Read native XLM balance through the configured helper, wallet runtime, Horizon, or Stellar CLI.
3. Subtract the relevant reserve from [demo-values.md](references/demo-values.md).
4. Report balance, reserve, spendable amount, and whether the requested action is allowed.
5. Stop and ask the operator if the wallet is missing, the network is not testnet, or the spendable amount is negative.

Output format:

```text
Balance check:
- Wallet: <address>
- Network: Stellar testnet
- Balance: <xlm> XLM
- Reserve: <xlm> XLM
- Spendable for this action: <xlm> XLM
- Result: pass|blocked
```

## Post A Loan Request

Use this when a borrower agent has enough credit capacity and needs XLM.

1. Run the wallet balance check.
2. Read borrower reputation and credit values.
3. Validate amount and fee model against [demo-values.md](references/demo-values.md).
4. Hash the readable purpose text offchain.
5. Attach privacy settings and attestation reference when required.
6. Call `post-demo-loan-request` for the known-good run, or `post_loan_request` with the arguments in [contract.md](references/contract.md).
7. Report Loan Request id, amount, fee model, privacy mode, and status.

## Review Open Loan Requests

Use this before any lender decision.

1. Call `list_open_loan_request_ids`.
2. Read each request with `get_loan_request`.
3. Skip anything not in status `Open`.
4. For each open request, read borrower reputation and note whether an attestation is present.
5. Summarize request id, borrower, amount, fee model, created time, privacy mode, and policy-relevant reputation facts.

## Lender Workflow

Use this flow when the agent may put idle XLM to work.

1. Check wallet balance.
2. Keep the configured lender reserve untouched.
3. Load or set the Lender Policy.
4. Read open Loan Requests.
5. Filter each request with the safety checks below.
6. If multiple requests pass, choose the request with the highest acceptable expected fee, breaking ties by earliest `created_at`.
7. Produce a short decision log before funding.
8. Fund only a request that passes policy.
9. Track active loans until repayment or recovery.

Known-good prompt:

```text
Run one ClawLoan Investment Heartbeat. Apply my Lender Policy first, then explain whether you will fund, wait, or reject.
```

## Evaluate A Request

Use this deterministic policy filter before funding.

1. Check lender spendable XLM after reserve.
2. Check current lender exposure from active loans.
3. Check request status, borrower address, amount, and fee model.
4. Check borrower reputation against `min_reputation_score`.
5. Verify attestation offchain if either the request or policy requires it.
6. Return `pass`, `wait`, or `reject` with the first blocking reason.

Policy result examples:

```text
Policy result: pass. Request #7 is open, amount is 10 XLM, fee is 200 bps, exposure remains below 20 XLM, and borrower eligibility passes.
```

```text
Policy result: reject. Request #9 asks for 12 XLM, which exceeds max_single_loan_amount = 10 XLM.
```

## Fund A Request

Use this only after `Evaluate A Request` returns `pass`.

1. Produce the decision log.
2. Confirm the request is still `Open`.
3. Call `run-lender-heartbeat-once` for the known-good autonomous flow, or `fund_loan_request` with the lender address and Loan Request id.
4. Report transaction hash, Loan id, borrower, lender, principal, and status `Active`.
5. Update the lender's active-loan notes.

## Investment Heartbeat

The heartbeat is the autonomous lending loop. Run it periodically or when the operator asks for one heartbeat.

1. Read wallet balance, lender reserve, Lender Policy, open Loan Requests, borrower reputations, and current lender exposure.
2. Reject requests that fail any safety rule.
3. Verify the Eligibility Attestation offchain when the policy or request requires it.
4. Select the best eligible request.
5. Write a compact decision log.
6. Call `run-lender-heartbeat-once` only when the deterministic result is `fund`.

Local helper commands:

```bash
scripts/run-lender-heartbeat-once
scripts/run-lender-heartbeat-loop --interval-ms 15000
```

Decision log format:

```text
Heartbeat result:
- Balance: <xlm> XLM
- Reserve: <xlm> XLM
- Available to lend: <xlm> XLM
- Open requests inspected: <count>
- Best Loan Request: #<id> for <amount> XLM
- Policy result: pass|wait|reject
- Decision: fund|wait|reject
- Reason: <one sentence>
```

## Borrower Heartbeat

Use the borrower heartbeat to notice low testnet balance, post one bounded Loan Request, and track repayment obligations. It must not repay automatically.

Local helper commands:

```bash
scripts/run-borrower-heartbeat-once
scripts/run-borrower-heartbeat-loop --interval-ms 15000
```

When an active loan exists, report the current amount due and wait for the explicit repayment workflow.

## Safety Checks

Never fund a Loan Request unless all checks pass:

- Lender balance after funding stays above `reserve_xlm`.
- Loan Request status is `Open`.
- Borrower is not the lender unless the operator explicitly enables a test-only self-funding run.
- Request amount is at or below `max_single_loan_amount`.
- Current exposure plus request amount is at or below `max_total_exposure`.
- Fee model base fee is at or above `min_fee_bps`.
- Fee model is valid: `base_fee_bps <= max_fee_bps`, `step_seconds > 0`, and `max_fee_bps <= 10000`.
- Borrower reputation score is at or above `min_reputation_score`, or a required Eligibility Attestation verifies the same eligibility offchain.
- The attestation is unexpired, nonce-bound, and bound to the borrower and request when an attestation is required.

Ask the operator before:

- funding when any value is unknown;
- raising policy limits;
- reducing the reserve;
- disabling attestation for a privacy run;
- changing contract ID, token address, or wallet identity;
- marking a loan defaulted.

## Active Loans And Repayment

For borrower agents:

1. List active loan ids for the borrower.
2. Read each loan and call `current_amount_due`.
3. Tell the operator the current amount due and that the fee can rise at the next step.
4. Repay only after an explicit borrower-agent or operator instruction.
5. Confirm status `Repaid`, fee paid, reputation update, and network stats.

For lender agents:

1. List active loan ids for the lender.
2. Report principal, borrower, funded time, current amount due, and whether the late threshold has passed.
3. Do not mark defaulted unless the admin/operator explicitly requests recovery and the late threshold has passed.

Borrower repayment prompt:

```text
Repay my active ClawLoan loan now. Check the current amount due first and report the fee paid after repayment.
```

## Recovery

When the flow is stuck, run `recover-demo` or follow [commands.md](references/commands.md). Prefer recovery over bypassing policy.

Common actions:

- stale open request: cancel if borrower-owned, or configure a fresh demo contract;
- active loan blocks credit: repay it, or mark defaulted only after the threshold and admin approval;
- lender waits: inspect reserve, exposure, fee, reputation, and attestation mismatch;
- stats lag: prefer direct `get_network_stats`; hide stale indexed charts.
