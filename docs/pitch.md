# ClawLoan Pitch

## Elevator Pitch

ClawLoan is autonomous XLM lending for AI agents. Agents install one skill, check their balances, post short-term Loan Requests, and lend idle XLM when an opportunity matches their policy. The core lending lifecycle runs on Stellar testnet.

## Problem

AI agents are starting to use wallets for payments, tools, and services. Wallet balances will not always have the right amount of XLM at the right time.

Some agents will need temporary XLM to keep operating. Other agents will have idle XLM that could be offered for repayment fees. Today there is no simple agent-native lending market where one agent can request capital and another can fund it through a bounded policy.

## Solution

ClawLoan turns agent liquidity into a market.

- Borrower agents request short-term XLM.
- Lender agents run an Investment Heartbeat.
- The heartbeat checks open Loan Requests, balance, reputation, exposure, and expected fee.
- If the request matches policy, the lender funds it.
- The borrower repays with a time-based fee.
- Repayment improves reputation and future credit access.

The main interface is a unified `SKILL.md`, not a traditional app dashboard. Agents use the skill to act. Humans use the landing page to install the skill and observe contract-backed testnet activity.

## Why Now

Agent wallets are becoming useful, but wallet ownership alone is not enough. Agents need simple financial primitives: liquidity, reputation, and bounded autonomous decision-making. ClawLoan ties those together in a scope small enough to build during the hackathon.

## Why Stellar

ClawLoan needs fast and low-cost settlement. The product only feels agent-native if funding and repayment are quick enough for autonomous workflows. Stellar gives the project wallets, XLM movement, Soroban state, contract events, and testnet deployment without making the flow feel like slow settlement.

## Trust Model

ClawLoan does not pretend unsecured lending has no risk. The first version is reputation-gated micro-lending:

- new agents start with small credit limits;
- successful repayment increases reputation and future limits;
- late or missing repayment reduces access;
- lender agents apply their own Lender Policy before funding;
- the requested amount, fee model, and repayment state are visible.

This is a credible MVP because risk is bounded and explicit, not because repayment is guaranteed.

## Privacy Story

The privacy claim is ZK reputation eligibility. A borrower should be able to prove enough to qualify for funding without revealing the private reputation witness behind that proof.

This is privacy with a purpose: it helps lenders make trust decisions using commitments, nullifiers, and proof public inputs instead of UI suppression. The MVP does not claim fully private payments or hidden onchain counterparties.

## Track Fit

**Main Track:** ClawLoan is a Stellar testnet MVP with XLM Loan Requests, funding, repayment, reputation, and contract events.

**Hack Agentic:** The lender agent autonomously invests idle XLM through a recurring Investment Heartbeat and bounded Lender Policy.

**Hack Privacy:** The borrower can prove reputation eligibility with a Groth16/BLS12-381 verifier path rather than relying on UI hiding. Full private settlement is out of scope for the MVP.

## Five-Minute Demo Promise

In five minutes, the jury should see:

1. A landing page explaining the ClawLoan skill and network stats.
2. A borrower agent using the skill to request XLM.
3. A lender agent using heartbeat logic to discover and evaluate the request.
4. The lender funding the request on Stellar.
5. The borrower repaying with a time-based fee.
6. Reputation and public stats updating after repayment from contract data or indexed testnet events.

## Taglines

- Autonomous XLM lending for AI agents.
- Put idle agent balances to work.
- Working capital for wallet-native agents.
- Skill-first lending on Stellar.
- Agents borrow, lend, repay, and build reputation.
