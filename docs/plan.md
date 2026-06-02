# Phased Plan

This plan is for building a hackathon MVP of Agent Lending Network: an agent-to-agent XLM lending platform with autonomous investment behavior, a seconds-long loan lifecycle, reputation-gated trust, and a privacy story around private receiving and private providing.

The main user interface is a set of installable `SKILL.md` files for agents. The frontend is a landing and observability page: it explains how to install/use the skills and visualizes public blockchain statistics. The priority is a clear five-minute demo, not a production lending protocol.

## Phase 0: Lock The Demo Shape

Goal: make the product story precise enough that every build decision supports the same demo.

Deliverables:

- Finalize the main demo flow:
  1. Presenter opens the landing page and shows how to install the skill.
  2. Borrower agent uses the skill to check balance and ask for short-term XLM.
  3. Borrower posts a lending request.
  4. Lender agent heartbeat discovers the request.
  5. Lender agent evaluates the request against its investment policy.
  6. Lender funds the request.
  7. Borrower repays with a time-based fee.
  8. Reputation and landing-page stats update after repayment.
- Pick the demo agents and their personalities.
- Pick demo-scale XLM amounts and fee tiers.
- Decide the privacy claim we will actually show live.
- Decide what will be onchain, what will be offchain, and what will be narrated as future privacy depth.
- Decide the skill package shape: one combined skill or separate borrower/lender skills.
- Use `docs/skill-interface.md`, `docs/privacy-strategy.md`, and `docs/landing-page.md` as the working docs for those decisions.

Exit criteria:

- One written demo script exists.
- We know the exact happy path to build.
- We have a crisp answer to the trust question: reputation-gated micro-lending with bounded limits, not collateralized lending.

## Phase 1: Soroban Contract MVP

Goal: create the onchain source of truth for requests, loans, repayment, policies, and reputation.

Deliverables:

- Replace the hello-world contract with the lending contract.
- Define contract types from `docs/data-structures.md`.
- Add core functions:
  - Register or update an agent.
  - Set an investment policy.
  - Post a lending request.
  - Cancel an open request.
  - Fund an open request.
  - Calculate current amount due.
  - Repay a loan.
  - Read agent reputation.
  - Read request and loan status.
- Implement tiered time-based repayment fees.
- Implement progressive credit limits and simple reputation updates.
- Emit events for agent registration, policy updates, request posting, funding, repayment, and reputation changes.
- Add focused contract tests for the happy path and the obvious failure paths.

Exit criteria:

- A borrower can post a request.
- A lender can fund it.
- The borrower can repay with a fee that changes over time.
- Reputation and open borrowed amount update correctly.
- Contract tests pass locally.

## Phase 2: Agent Skill Package

Goal: make the project usable by AI agents through `SKILL.md` files.

Deliverables:

- Create the main Agent Lending skill.
- Use `docs/skill-interface.md` as the source plan.
- Include concise workflows for:
  - Checking wallet balance.
  - Posting a lending request.
  - Reviewing open requests.
  - Evaluating a request against an investment policy.
  - Funding a request.
  - Checking active loans.
  - Repaying a loan.
- Add a heartbeat workflow for autonomous lender behavior.
- Add safety rules: max exposure, max single loan, minimum reputation, minimum fee, and when to ask the operator for confirmation.
- Add examples of borrower-agent and lender-agent prompts.
- Add references for contract function names, expected arguments, and demo values.

Exit criteria:

- An agent can load the skill and understand how to participate in the lending network.
- The demo can be driven through skill-guided agent prompts.
- The skill instructions are concise enough to be practical in a real agent context.

## Phase 3: Agent Heartbeat

Goal: make the Agentic track credible by showing autonomous investment behavior.

Deliverables:

- Implement a recurring heartbeat loop for lender agents.
- On each heartbeat, the lender agent checks:
  - Its XLM balance.
  - Open lending requests.
  - Its investment policy.
  - Borrower reputation.
  - Existing loan exposure.
- Let the lender agent autonomously decide to fund, wait, or reject.
- Implement a borrower-side heartbeat that can notice low balance, post a request, and track repayment obligations.
- Log heartbeat decisions in chat so the audience sees the autonomous reasoning.

Exit criteria:

- The lender funds a request without a human clicking a manual "fund this" decision.
- The heartbeat reasoning is visible in chat.
- The autonomous action remains bounded by the lender's policy.

## Phase 4: Landing Page And Blockchain Stats

Goal: provide the public-facing project page and show live network activity.

Deliverables:

- Build a landing page that explains:
  - What Agent Lending Network is.
  - How to install the skill.
  - How borrower and lender agents use it.
  - How the project fits the three hackathon tracks.
- Add blockchain-derived stats:
  - Open lending requests.
  - Total requests posted.
  - Total funded loans.
  - Total repayments.
  - Total XLM lent.
  - Request count over time graph.
- Link to contract address, repo, docs, and skill files.
- Use `docs/landing-page.md` as the source plan.

Exit criteria:

- A visitor understands the project without needing the presenter.
- The landing page reinforces that the skill is the primary interface.
- Stats are read from chain data or contract events where feasible.

## Phase 5: Privacy Track MVP

Goal: include a credible privacy component without pretending public Soroban storage is private.

Deliverables:

- Implement the recommended first privacy feature: selective reputation eligibility.
- Use `docs/privacy-strategy.md` as the source plan.
- Borrower proves or presents a proof reference for a limited statement, such as:
  - reputation score is above the lender's threshold;
  - current credit limit is enough for the requested amount;
  - default count is zero or below an accepted threshold.
- Avoid exposing full repayment history, prior counterparties, or all prior loan amounts.
- Represent privacy intent with `PrivacyMode`.
- Keep sensitive narrative fields offchain and reference them with hashes.
- Add a clear explanation of what is hidden, from whom, and what is still public.
- If time allows, add an onchain verifier path. If not, use a proof-reference or signed-attestation path and document the exact limitation.

Exit criteria:

- The privacy demo is honest and narrow.
- The pitch can explain public storage limits.
- The product still clearly fits the Hack Privacy track.

## Phase 6: Testnet Deployment And Integration

Goal: make the project demonstrably real on Stellar testnet.

Deliverables:

- Build the Soroban contract.
- Deploy to Stellar testnet.
- Store deployment details in project docs.
- Connect frontend actions to the deployed contract.
- Seed demo agents with testnet XLM.
- Run the full demo flow against testnet.

Exit criteria:

- Public repo has deployable contract code.
- README explains how to run the frontend and contract.
- Demo can run end-to-end on testnet.

## Phase 7: Submission Package

Goal: package the project for all three hackathon tracks.

Deliverables:

- README with project narrative, setup, testnet deployment, and demo flow.
- Technical docs for contract data structures and lifecycle.
- Pitch deck for a five-minute presentation.
- Demo script with timing.
- Track-specific explanation:
  - Main Track: useful Stellar testnet MVP.
  - Hack Agentic: heartbeat-driven autonomous investment.
  - Hack Privacy: private receiving/providing with selective disclosure.

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
5. Landing page and blockchain stats.
6. Privacy proof-of-concept.
7. Testnet deployment.
8. Pitch and docs.

The main risk is trying to make privacy too ambitious before the lending lifecycle works. The lending loop and skill interface must work first; privacy should be narrow, honest, and easy to explain.

## Open Planning Questions

- Should selective reputation eligibility use a signed attestation, an offchain proof reference, or an onchain verifier for the live demo?
- Should the skill package be one unified skill or separate borrower/lender skills?
- Should the borrower repay automatically as part of the demo, or should its agent explain and trigger repayment after receiving funds?
- How much of the heartbeat should be deterministic rules versus LLM-generated reasoning?
- What is the smallest testnet flow that still proves all three tracks?
