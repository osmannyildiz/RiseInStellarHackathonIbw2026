# Phased Plan

This plan is for building a functional Stellar testnet MVP of ClawLoan: an agent-to-agent XLM lending platform with autonomous lending behavior, a short live loan lifecycle, reputation-gated trust, and a privacy story around selective reputation disclosure.

The main user interface is one installable `SKILL.md` file for agents. The frontend is a landing and observability page: it explains how to install/use the skill and visualizes contract-backed testnet statistics. Automation, seed scripts, local indexing, and recovery commands are part of the delivery because they make the real testnet flow reliable and error-tolerant.

## Phase 0: Lock The Demo Shape

Goal: make the product story precise enough that every build decision supports the same testnet flow.

Deliverables:

- Finalize the main demo flow:
  1. Presenter opens the landing page and shows how to install the skill.
  2. Borrower agent uses the skill to check balance and ask for short-term XLM.
  3. Borrower posts a Loan Request.
  4. Lender agent heartbeat discovers the request.
  5. Lender agent evaluates the request against its Lender Policy.
  6. Lender funds the request.
  7. Borrower repays with a time-based fee.
  8. Reputation and landing-page stats update after repayment, using contract data or indexed testnet events.
- Pick the target agents and test their setup.
- Pick testnet-safe XLM amounts and fee tiers.
- Use selective reputation eligibility as the live privacy claim.
- Decide what will be onchain, what will be offchain, and what will be clearly labeled as future privacy depth.
- Use one unified skill package.
- Use `docs/mvp-build-spec.md`, `docs/pitch.md`, `docs/skill-interface.md`, `docs/privacy-strategy.md`, `docs/landing-page.md`, `docs/agent-targets.md`, and `docs/testnet-runbook.md` as the working docs for those decisions.

Exit criteria:

- One written testnet runbook exists.
- We know the exact happy path and recovery paths to build.
- We have a crisp answer to the trust question: reputation-gated micro-lending with bounded limits, not collateralized lending.

## Phase 1: Soroban Contract MVP

Goal: create the onchain source of truth for requests, loans, repayment, policies, and reputation.

Deliverables:

- Replace the hello-world contract with the lending contract.
- Define contract types from `docs/data-structures.md` and behavior from `docs/mvp-build-spec.md`.
- Add core functions:
  - Register or update an agent.
  - Set a Lender Policy.
  - Post a Loan Request.
  - Cancel an open Loan Request.
  - Fund an open Loan Request.
  - Calculate current amount due.
  - Repay a loan.
  - Read agent reputation.
  - Read request and loan status.
- Implement tiered time-based repayment fees.
- Implement progressive credit limits and simple reputation updates.
- Implement contract errors and authorization rules from `docs/mvp-build-spec.md`.
- Emit events for agent registration, policy updates, request posting, funding, repayment, and reputation changes.
- Add focused contract tests for the happy path and the obvious failure paths.

Exit criteria:

- A borrower can post a Loan Request.
- A lender can fund it.
- The borrower can repay with a fee that changes over time.
- Reputation and open borrowed amount update correctly.
- Contract tests pass locally.

## Phase 2: ClawLoan Skill Package

Goal: make the project usable by AI agents through `SKILL.md` files.

Deliverables:

- Create the unified ClawLoan skill.
- Use `docs/skill-interface.md` as the source plan.
- Include concise workflows for:
  - Checking wallet balance.
  - Posting a Loan Request.
  - Reviewing open Loan Requests.
  - Evaluating a Loan Request against a Lender Policy.
  - Funding a request.
  - Checking active loans.
  - Repaying a loan.
- Add a heartbeat workflow for autonomous lender behavior.
- Add safety rules: max exposure, max single loan, minimum reputation, minimum fee, and when to ask the operator for confirmation.
- Add examples of borrower-agent and lender-agent prompts.
- Add references for contract function names, expected arguments, configured testnet values, and recovery commands from `docs/mvp-build-spec.md`.
- Validate the skill against the selected target agents.

Exit criteria:

- An agent can load the skill and understand how to participate in the lending network.
- The demo can be driven through skill-guided agent prompts.
- The skill instructions are concise enough to be practical in a real agent context.

## Phase 3: Agent Heartbeat

Goal: make the Agentic track credible by showing bounded autonomous lending behavior.

Deliverables:

- Implement a recurring heartbeat loop for lender agents.
- On each heartbeat, the lender agent checks:
  - Its XLM balance.
  - Open Loan Requests.
  - Its Lender Policy.
  - Borrower reputation.
  - Existing loan exposure.
- Let the lender agent autonomously decide to fund, wait, or reject.
- Implement a borrower-side heartbeat that can notice low balance, post a Loan Request, and track repayment obligations.
- Log heartbeat decisions in chat so the audience sees the autonomous reasoning.

Exit criteria:

- The lender funds a request without a human clicking a manual "fund this" decision.
- The heartbeat reasoning is visible in chat.
- The autonomous action remains bounded by the lender's policy.

## Phase 4: Landing Page And Network Stats

Goal: provide the public-facing project page and show contract-backed testnet network activity.

Deliverables:

- Build a landing page that explains:
  - What ClawLoan is.
  - How to install the skill.
  - How borrower and lender agents use it.
  - How the project fits the three hackathon tracks.
- Add network stats from contract events, contract read methods, or a local indexer that reads real testnet activity:
  - Open Loan Requests.
  - Loan Requests Posted.
  - Loans Funded.
  - Loans Repaid.
  - Total XLM Lent.
  - Loan Requests Over Time only after event indexing is implemented.
- Link to contract address, repo, docs, and skill files.
- Use `docs/landing-page.md` as the source plan.

Exit criteria:

- A visitor understands the project without needing the presenter.
- The landing page reinforces that the skill is the primary interface.
- Stats are read from chain data or contract events where feasible; any local indexer must use real testnet transactions/events and must not present static data as live chain data.

## Phase 5: Privacy Track MVP

Goal: include a credible privacy component without pretending public Soroban storage is private.

Deliverables:

- Implement the recommended first privacy feature: selective reputation eligibility.
- Use `docs/privacy-strategy.md` as the source plan.
- Borrower presents an Eligibility Attestation for a limited statement, such as:
  - reputation score is above the lender's threshold;
  - current credit limit is enough for the requested amount;
  - default count is zero or below an accepted threshold.
- Avoid exposing full repayment history or all prior loan amounts to the lender-facing UI.
- Represent privacy intent with `PrivacyMode`.
- Keep sensitive narrative fields offchain and reference them with hashes.
- Add a clear explanation of what is hidden, from whom, and what is still public.
- Use an Eligibility Attestation path for the MVP and document the exact limitation.
- Treat an onchain ZK verifier as stretch only after the core lending lifecycle works.

Exit criteria:

- The privacy demo is honest and narrow.
- The pitch can explain public storage limits.
- The product still clearly fits the Hack Privacy track without claiming full private settlement.

## Phase 6: Testnet Deployment And Integration

Goal: make the project demonstrably real on Stellar testnet.

Deliverables:

- Build the Soroban contract.
- Deploy to Stellar testnet.
- Store deployment details in project docs.
- Connect frontend actions to the deployed contract.
- Seed demo agents with testnet XLM.
- Run the full demo flow against testnet.
- Add automation and convenience scripts:
  - seed or reset testnet agent accounts;
  - deploy or redeploy the contract;
  - configure skill references with current contract IDs;
  - post a known-good Loan Request;
  - run a lender heartbeat once;
  - repay an active loan;
  - rebuild local stats from contract events;
  - recover from a failed or stale run.
- Use `docs/testnet-runbook.md` as the source plan for these scripts and recovery steps.

Exit criteria:

- Public repo has deployable contract code.
- README explains how to run the frontend and contract.
- The end-to-end flow can run on testnet repeatedly with documented recovery paths.

## Phase 7: Submission Package

Goal: package the project for all three hackathon tracks.

Deliverables:

- README with project narrative, setup, testnet deployment, and demo flow.
- Technical docs for contract data structures and lifecycle.
- Pitch deck for a five-minute presentation.
- Demo script with timing.
- Jury-facing copy based on `docs/pitch.md`.
- Track-specific explanation:
  - Main Track: useful Stellar testnet MVP.
  - Hack Agentic: heartbeat-driven autonomous lending.
  - Hack Privacy: selective reputation disclosure.

Exit criteria:

- The project explicitly selects all three tracks.
- The pitch answers trust, autonomy, privacy, and Stellar-fit questions.
- The demo is rehearsed and under five minutes.

## Build Order Recommendation

Build in this order:

1. Contract happy path.
2. Contract tests.
3. Agent skill package.
4. Heartbeat automation.
5. Landing page and network stats.
6. Privacy Eligibility Attestation path.
7. Testnet deployment.
8. Pitch and docs.

The main risk is trying to make privacy too ambitious before the lending lifecycle works. The lending loop and skill interface must work first; privacy should be narrow, honest, and easy to explain.

## Resolved Planning Decisions

- Use one unified ClawLoan skill.
- Use tiered capped time-based fees.
- Use reputation-gated unsecured micro-lending, not collateral.
- Use an Eligibility Attestation for the privacy MVP.
- Treat onchain ZK verification as stretch only.
- Use contract-backed testnet stats; local indexes are acceptable only when built from real testnet activity.

## Resolved Implementation Questions

- Attestation issuer for MVP: local reputation helper script.
- Borrower repayment for MVP: explicit operator-triggered borrower-agent action.
- Heartbeat for MVP: deterministic policy filter first, agent explanation second.
- Smallest testnet flow: one Borrower Agent, one Lender Agent, one Loan Request, one funding transaction, one repayment transaction, and contract-backed stats.
