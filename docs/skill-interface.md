# ClawLoan Skill Interface

The main way to use ClawLoan is through one installable `SKILL.md` file. The frontend explains the project and shows blockchain statistics, but agents should be able to participate directly through the skill-guided workflows.

## Recommended Shape

Use one unified skill:

```text
clawloan/
  SKILL.md
  references/
    contract.md
    demo-values.md
    privacy.md
    agent-targets.md
```

A single skill is the chosen package shape because one agent may borrow, lend, or do both. The skill can contain separate borrower and lender workflows without splitting installation.

## Skill Purpose

The skill teaches an AI agent how to:

- Check its XLM balance.
- Read open Loan Requests.
- Post a short-term Loan Request.
- Evaluate whether to fund another agent's request.
- Apply a Lender Policy before lending.
- Repay an active loan with a time-based fee.
- Track reputation and credit limits.
- Explain its autonomous decisions in a human-readable way.

The value of the skill is that ClawLoan is not asking humans to operate a DeFi dashboard on behalf of agents. The agent receives the workflow directly and can act inside its own runtime, using its own wallet, policy, and heartbeat.

## Trigger Description Draft

The `SKILL.md` frontmatter should make the skill trigger when an agent needs to borrow, lend, invest idle XLM, inspect agent Loan Requests, run an Investment Heartbeat, or manage repayment on ClawLoan.

Draft:

```yaml
---
name: clawloan
description: Use ClawLoan on Stellar. Enables AI agents to check XLM balance, post Loan Requests, review open Loan Requests, apply a Lender Policy, fund eligible requests within configured wallet limits, repay loans with time-based fees, and track reputation-gated credit.
---
```

## Core Workflows

### Borrower Workflow

1. Check current XLM balance.
2. Decide whether balance is below the agent's operating threshold.
3. Check current credit limit and open borrowed amount.
4. Post a Loan Request with amount, fee model, purpose commitment, and privacy mode.
5. Monitor whether the request is funded.
6. Track current amount due after funding.
7. Repay as soon as the borrowed capital is no longer needed.
8. Confirm reputation update after repayment.

### Lender Workflow

1. Check current XLM balance.
2. Load the agent's Lender Policy.
3. Read open Loan Requests.
4. Filter out requests that violate policy:
   - amount too high;
   - borrower reputation too low;
   - fee too low;
   - exposure too high;
   - Eligibility Attestation missing when required.
5. Select the best remaining request.
6. Fund the request.
7. Track the active loan until repayment.
8. Update internal notes about realized fees and borrower behavior.

### Heartbeat Workflow

The heartbeat is the Agentic track centerpiece. It runs periodically or on operator trigger and asks:

1. Do I have idle XLM above my reserve?
2. Are there open Loan Requests that match my policy?
3. Is the expected fee worth the exposure?
4. Is the borrower eligible based on reputation or an Eligibility Attestation?
5. Should I lend, wait, or reduce exposure?

The heartbeat should produce a short decision log. Example:

```text
Heartbeat result:
- Balance: 42 XLM
- Reserve: 15 XLM
- Available to lend: 27 XLM
- Best Loan Request: #7 for 10 XLM
- Borrower reputation: eligible
- Fee model: acceptable
- Decision: fund Loan Request #7
```

This decision log matters because it shows that the agent is applying a policy before taking a financial action.

## Lender Policy Fields

The skill should ask the agent to maintain or load these policy values:

- `reserve_xlm`: balance the agent should not lend below.
- `max_single_loan_amount`: largest single loan the agent may fund.
- `max_total_exposure`: maximum XLM locked in active loans.
- `min_reputation_score`: minimum borrower score.
- `min_fee_bps`: minimum acceptable fee.
- `max_duration_seconds`: maximum preferred open-loan duration.
- `require_eligibility_attestation`: whether reputation eligibility must be proved selectively.

## Safety Rules

The skill should never lend just because a request exists. It must check:

- The lender has enough spendable XLM after reserves.
- The Loan Request is open.
- The borrower is not the lender itself unless explicitly allowed for testing.
- The Loan Request amount is within policy.
- The lender's total exposure remains within policy.
- The fee model meets the lender's minimum.
- The borrower reputation or Eligibility Attestation satisfies policy.

For the hackathon run, the skill may use predefined testnet agent wallets, configured limits, and recovery commands. It must ask the operator before changing wallet configuration, raising exposure limits, or using non-testnet credentials.

## Frontend Relationship

The frontend should not be the control center. It should:

- Explain how to install the skill.
- Show example prompts.
- Link to the skill folder and repo.
- Show live or indexed blockchain statistics.
- Show contract deployment details.

Useful stats:

- Loan Requests Posted;
- Open Loan Requests;
- Loans Funded;
- Loans Repaid;
- Total XLM Lent;
- Total Fees Paid;
- Average Repayment Time;
- Loan Requests Over Time.

## Initial Target Agents

Candidate compatibility targets are:

- OpenClaw;
- Hermes Agent;
- PicoClaw.

See `docs/agent-targets.md` for the validation checklist and current target recommendation.

## First Skill Draft Scope

The first `SKILL.md` should include only the core workflows and safety rules. Put contract function signatures, configured testnet values, recovery commands, and privacy details in references so the skill stays concise.
