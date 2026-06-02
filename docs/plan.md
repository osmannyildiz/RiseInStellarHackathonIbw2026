# Phased Plan

This plan is for building a hackathon MVP of Agent Lending Network: an agent-to-agent XLM lending platform with autonomous investment behavior, a seconds-long loan lifecycle, reputation-gated trust, and a privacy story around private receiving and private providing.

The priority is a clear five-minute demo, not a production lending protocol.

## Phase 0: Lock The Demo Shape

Goal: make the product story precise enough that every build decision supports the same demo.

Deliverables:

- Finalize the main demo flow:
  1. Borrower agent asks for short-term XLM through chat.
  2. Borrower posts a lending request.
  3. Lender agent heartbeat discovers the request.
  4. Lender agent evaluates the request against its investment policy.
  5. Lender funds the request.
  6. Borrower repays with a time-based fee.
  7. Reputation updates after repayment.
- Pick the demo agents and their personalities.
- Pick demo-scale XLM amounts and fee tiers.
- Decide the privacy claim we will actually show live.
- Decide what will be onchain, what will be offchain, and what will be narrated as future privacy depth.

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

## Phase 2: Frontend Chatbot Demo UI

Goal: make the demo understandable through chatbot-style agent UIs.

Deliverables:

- Build a page with multiple agent chat panels.
- Show each agent's wallet identity, XLM balance, policy summary, and reputation summary.
- Let the borrower agent post a request from chat.
- Let the lender agent explain why it funds or rejects a request.
- Show active requests and active loans in a compact marketplace/status area.
- Show transaction and contract event results in human-readable form.
- Make the UI emphasize agent reasoning, not raw contract controls.

Exit criteria:

- A judge can follow the whole loan lifecycle from chat messages.
- The UI shows before/after balances and reputation.
- The UI makes it clear that real Stellar/Soroban actions are happening.

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

## Phase 4: Privacy Track MVP

Goal: include a credible privacy component without pretending public Soroban storage is private.

Deliverables:

- Pick one privacy feature to demonstrate live:
  - Reputation proof reference: borrower proves eligibility without exposing full repayment history.
  - Purpose hash: borrower commits to request context without storing full purpose publicly.
  - Separate display identity from settlement address to reduce casual counterparty disclosure in the UI.
- Represent privacy intent with `PrivacyMode`.
- Keep sensitive narrative fields offchain and reference them with hashes.
- Add a clear explanation of what is hidden, from whom, and what is still public.

Exit criteria:

- The privacy demo is honest and narrow.
- The pitch can explain public storage limits.
- The product still clearly fits the Hack Privacy track.

## Phase 5: Testnet Deployment And Integration

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

## Phase 6: Submission Package

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
3. Basic frontend contract calls.
4. Chatbot UI around the happy path.
5. Heartbeat automation.
6. Privacy proof-of-concept.
7. Testnet deployment.
8. Pitch and docs.

The main risk is trying to make privacy too ambitious before the lending lifecycle works. The lending loop must work first; privacy should be narrow, honest, and easy to explain.

## Open Planning Questions

- Which privacy feature is most realistic and compelling for the live demo?
- Do we want one borrower and one lender, or one borrower and two lenders with different policies?
- Should the borrower repay automatically as part of the demo, or should its chatbot explain and trigger repayment after receiving funds?
- How much of the heartbeat should be deterministic rules versus LLM-generated reasoning?
- What is the smallest testnet flow that still proves all three tracks?
