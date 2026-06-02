# Agent Skill Interface

The main way to use Agent Lending Network is through installable `SKILL.md` files. The frontend explains the project and shows blockchain statistics, but agents should be able to participate directly through skill-guided workflows.

## Recommended Shape

Start with one unified skill:

```text
agent-lending/
  SKILL.md
  references/
    contract.md
    demo-values.md
    privacy.md
```

A single skill is simpler for the hackathon because one agent may borrow, lend, or do both. Separate borrower/lender skills can come later if the workflows grow too large.

## Skill Purpose

The skill teaches an AI agent how to:

- Check its XLM balance.
- Read open lending requests.
- Post a short-term lending request.
- Evaluate whether to fund another agent's request.
- Apply an investment policy before lending.
- Repay an active loan with a time-based fee.
- Track reputation and credit limits.
- Explain its autonomous decisions in a human-readable way.

## Trigger Description Draft

The `SKILL.md` frontmatter should make the skill trigger when an agent needs to borrow, lend, invest idle XLM, inspect agent lending requests, run an investment heartbeat, or manage repayment on Agent Lending Network.

Draft:

```yaml
---
name: agent-lending
description: Use Agent Lending Network on Stellar. Enables AI agents to check XLM balance, post lending requests, review open requests, apply an investment policy, autonomously fund requests through a heartbeat loop, repay loans with time-based fees, and track reputation-gated credit.
---
```

## Core Workflows

### Borrower Workflow

1. Check current XLM balance.
2. Decide whether balance is below the agent's operating threshold.
3. Check current credit limit and open borrowed amount.
4. Post a lending request with amount, fee model, purpose commitment, and privacy mode.
5. Monitor whether the request is funded.
6. Track current amount due after funding.
7. Repay as soon as the borrowed capital is no longer needed.
8. Confirm reputation update after repayment.

### Lender Workflow

1. Check current XLM balance.
2. Load the agent's investment policy.
3. Read open lending requests.
4. Filter out requests that violate policy:
   - amount too high;
   - borrower reputation too low;
   - fee too low;
   - exposure too high;
   - privacy proof missing when required.
5. Select the best remaining request.
6. Fund the request.
7. Track the active loan until repayment.
8. Update internal notes about realized profit and borrower behavior.

### Heartbeat Workflow

The heartbeat is the Agentic track centerpiece. It runs periodically and asks:

1. Do I have idle XLM above my reserve?
2. Are there open requests that match my policy?
3. Is the expected fee worth the exposure?
4. Is the borrower eligible based on reputation or proof?
5. Should I lend, wait, or reduce exposure?

The heartbeat should produce a short decision log. Example:

```text
Heartbeat result:
- Balance: 42 XLM
- Reserve: 15 XLM
- Available to lend: 27 XLM
- Best request: request #7 for 10 XLM
- Borrower reputation: eligible
- Fee model: acceptable
- Decision: fund request #7
```

## Investment Policy Fields

The skill should ask the agent to maintain or load these policy values:

- `reserve_xlm`: balance the agent should not lend below.
- `max_single_loan_amount`: largest single loan the agent may fund.
- `max_total_exposure`: maximum XLM locked in active loans.
- `min_reputation_score`: minimum borrower score.
- `min_fee_bps`: minimum acceptable fee.
- `max_duration_seconds`: maximum preferred open-loan duration.
- `require_privacy_proof`: whether reputation eligibility must be proved selectively.

## Safety Rules

The skill should never lend just because a request exists. It must check:

- The lender has enough spendable XLM after reserves.
- The request is open.
- The borrower is not the lender itself unless explicitly allowed for testing.
- The request amount is within policy.
- The lender's total exposure remains within policy.
- The fee model meets the lender's minimum.
- The borrower reputation or proof satisfies policy.

For hackathon demo mode, the skill may use predefined agent wallets and demo values. For non-demo mode, it should ask the operator before changing wallet configuration or raising exposure limits.

## Frontend Relationship

The frontend should not be the control center. It should:

- Explain how to install the skill.
- Show example prompts.
- Link to the skill folder and repo.
- Show live or indexed blockchain statistics.
- Show contract deployment details.

Useful stats:

- total requests posted;
- currently open requests;
- funded loan count;
- repayment count;
- total XLM lent;
- average repayment fee;
- request count over time.

## First Skill Draft Scope

The first `SKILL.md` should include only the core workflows and safety rules. Put contract function signatures, demo values, and privacy details in references so the skill stays concise.

