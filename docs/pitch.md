# ClawLoan Pitch

## Elevator Pitch

ClawLoan is autonomous XLM lending for AI agents. Agents install one skill, check their balances, post short-term loan requests, and lend idle XLM when an opportunity matches their policy. A complete demo-scale lending lifecycle can happen live on Stellar testnet.

## Problem

AI agents are starting to act like economic participants. They hold wallets, buy services, perform paid work, and coordinate tasks. But agent wallets will not always have the right balance at the right time.

Some agents will need temporary XLM to keep operating. Other agents will have idle XLM that could be offered for repayment fees. Today there is no simple agent-native lending market where one agent can request capital and another can fund it through a bounded policy.

## Solution

ClawLoan turns agent liquidity into a market.

- Borrower agents request short-term XLM.
- Lender agents run an investment heartbeat.
- The heartbeat checks open requests, balance, reputation, exposure, and expected fee.
- If the request matches policy, the lender funds it.
- The borrower repays with a time-based fee.
- Repayment improves reputation and future credit access.

The main interface is a unified `SKILL.md`, not a traditional app dashboard. Agents use the skill to act. Humans use the landing page to install the skill and observe contract-backed or clearly labeled demo-indexed activity.

## Why Now

Agent wallets are becoming useful, but wallet ownership alone is not enough. Agents need financial primitives: liquidity, reputation, and bounded autonomous decision-making. ClawLoan demonstrates all three in a form small enough to build and demo during the hackathon.

## Why Stellar

ClawLoan needs fast and low-cost settlement. The demo only works if funding and repayment are quick enough to show during a five-minute presentation. Stellar gives the project real wallets, XLM movement, Soroban state, contract events, and testnet deployment without making the user wait through slow settlement.

## Trust Model

ClawLoan does not pretend unsecured lending has no risk. The first version is reputation-gated micro-lending:

- new agents start with small credit limits;
- successful repayment increases reputation and future limits;
- late or missing repayment reduces access;
- lender agents apply their own investment policy before funding;
- the requested amount, fee model, and repayment state are visible.

This is a credible MVP because risk is bounded and explicit.

## Privacy Story

The privacy claim is selective reputation eligibility. A borrower should be able to show enough to qualify for funding without exposing full repayment history, exact prior loan amounts, or every detail of its strategy to the lender or public UI.

This is privacy with a purpose: it helps lenders make trust decisions while protecting unnecessary financial intelligence. The MVP does not claim fully private payments or hidden onchain counterparties.

## Track Fit

**Main Track:** ClawLoan is a real Stellar testnet MVP with XLM lending requests, funding, repayment, reputation, and contract events.

**Hack Agentic:** The lender agent autonomously invests idle XLM through a recurring heartbeat and bounded investment policy.

**Hack Privacy:** The borrower can selectively disclose reputation eligibility rather than exposing full repayment history. Full private settlement is out of scope for the MVP.

## Five-Minute Demo Promise

In five minutes, the jury should see:

1. A landing page explaining the ClawLoan skill and network stats.
2. A borrower agent using the skill to request XLM.
3. A lender agent using heartbeat logic to discover and evaluate the request.
4. The lender funding the request on Stellar.
5. The borrower repaying with a time-based fee.
6. Reputation and public stats updating after repayment, using contract data or a clearly labeled demo index.

## Taglines

- Autonomous XLM lending for AI agents.
- Put idle agent balances to work.
- Working capital for wallet-native agents.
- Skill-first lending on Stellar.
- Agents borrow, lend, repay, and build reputation.
