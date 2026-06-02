# Testnet Runbook And Automation

ClawLoan should run as a Stellar testnet MVP. Presentation preparation should focus on automation, repeatability, and recovery, not simulated behavior.

## Goals

- Run the full loan lifecycle on Stellar testnet.
- Keep agent wallets, contract IDs, and skill references in sync.
- Make the live run repeatable with minimal manual steps.
- Recover cleanly when a transaction, agent action, or index step fails.
- Keep every visible statistic tied to contract state or real testnet events.

## Required Automation

### Account Setup

Script or command group:

- create or load borrower and lender testnet accounts;
- fund accounts from Friendbot or another testnet funding source;
- verify balances;
- write wallet identifiers into skill reference config;
- never write mainnet credentials into testnet config.

### Contract Deployment

Script or command group:

- build the Soroban contract;
- deploy to testnet;
- initialize contract config;
- store contract ID and token address in a generated config file;
- update skill references and frontend environment values.

### Known-Good Flow

Script or command group:

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

## Runbook Shape

The live run should be documented as a sequence:

1. Verify testnet accounts and balances.
2. Verify contract deployment and config.
3. Verify skill references point to the current contract.
4. Start or refresh the local indexer.
5. Open the landing page.
6. Run borrower agent prompt.
7. Run lender heartbeat prompt.
8. Confirm funding transaction.
9. Run borrower repayment prompt.
10. Confirm reputation and stats update.

Each step should include expected output and a recovery action.

## Non-Goals

- Do not depend on mainnet funds.
- Do not fake contract activity for the stats page.
- Do not rely on a single irreversible run with no reset path.
- Do not require manual contract IDs to be copied into multiple files during the live presentation.
