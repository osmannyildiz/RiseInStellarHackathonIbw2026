# Helper Commands

Use these project-level commands when they are implemented in the local environment. They are the intended interface for agents because they keep wallet config, contract IDs, and demo values synchronized.

The Phase 3 heartbeat commands are implemented under `scripts/`. They currently use a local demo-state adapter at `generated/clawloan-demo-state.json` unless `--state <path>` is supplied. Treat that adapter as agent-heartbeat automation state, not live chain data. Testnet contract-backed invocation remains part of the later deployment/integration phase.

## Setup And Configuration

### `setup-testnet-accounts`

Creates or loads borrower, lender, and proof verifier testnet identities, funds them where possible, verifies balances, and writes wallet identifiers into generated config.

Safety:

- never write mainnet credentials into testnet config;
- ask the operator before replacing an existing wallet identity.

### `deploy-contract`

Builds and deploys the Soroban contract to Stellar testnet, initializes config, and stores contract ID plus token address.

If `stellar contract build` cannot find `core` for `wasm32v1-none`, rerun with:

```bash
PATH=/Users/osman/.cargo/bin:$PATH stellar contract build
```

### `configure-demo`

Writes contract ID, token address, agent IDs, default fee model, and testnet values into generated skill/frontend config. Use this instead of manually copying contract IDs.

## Known-Good Flow

### `post-demo-loan-request`

Local command:

```bash
scripts/post-demo-loan-request
```

Registers borrower if needed and posts the known-good `10 XLM` Loan Request with the default fee model, purpose hash, and first-run privacy settings.

Expected output:

- Loan Request id;
- borrower address;
- amount;
- status `Open`.

### `run-lender-heartbeat-once`

Local command:

```bash
scripts/run-lender-heartbeat-once
```

Reads balance, open Loan Requests, Lender Policy, borrower reputation, and current exposure. Applies deterministic policy checks, verifies proof if required, and funds the best eligible request.

Expected output:

- balance and reserve;
- policy pass/fail reasons;
- selected Loan Request id, if any;
- funding transaction hash and Loan id when funded.

### `run-lender-heartbeat-loop`

Local command:

```bash
scripts/run-lender-heartbeat-loop --interval-ms 15000
```

Runs the lender heartbeat repeatedly. Add `--count <n>` for a bounded run, or leave count at `0` to run until stopped by the agent runtime/operator.

### `run-borrower-heartbeat-once`

Local command:

```bash
scripts/run-borrower-heartbeat-once
```

Checks borrower balance, open Loan Requests, active loans, and repayment obligations. If balance is below the configured low-balance threshold, no active loan exists, no open request exists, and borrower auto-posting is enabled, it posts one bounded demo Loan Request. It does not auto-repay.

Expected output:

- borrower balance and reserve;
- active loan count;
- open request count;
- post/wait/track repayment decision;
- current amount due for active loans.

### `run-borrower-heartbeat-loop`

Local command:

```bash
scripts/run-borrower-heartbeat-loop --interval-ms 15000
```

Runs the borrower heartbeat repeatedly. Add `--count <n>` for a bounded run, or leave count at `0` to run until stopped.

### `repay-demo-loan`

Local command:

```bash
scripts/repay-demo-loan
```

Reads active borrower loan, calculates `current_amount_due`, repays the loan, and verifies status and reputation updates.

Expected output:

- loan id;
- current amount due;
- repayment transaction hash;
- fee paid;
- status `Repaid`.

## Stats And Recovery

### `rebuild-stats`

Reads direct contract stats and rebuilds any local event index from real testnet activity. If event indexing is unavailable, keep time-series charts hidden or marked unavailable.

### `recover-demo`

Local command:

```bash
scripts/recover-demo
```

Lists contract config, open Loan Requests, active loans, and likely recovery actions.

Use recovery guidance:

| Problem | Action |
| --- | --- |
| Wrong contract ID | Run `configure-demo`. |
| Stale open Loan Request | Cancel borrower-owned request or use a fresh configured contract. |
| Active loan blocks credit | Run `repay-demo-loan`; default only after threshold and admin approval. |
| Lender will not fund | Inspect reserve, exposure, fee, reputation, and proof mismatch. |
| Request already funded | Continue with the existing Loan id. |
| Repayment amount changed | Repay the current due amount. |
| Stats lag | Prefer `get_network_stats`; rerun `rebuild-stats`. |
| Testnet account low | Re-fund or switch to a pre-funded testnet identity. |

## Direct Contract Reads

When helper commands are unavailable, use direct reads from [contract.md](contract.md):

- `get_config`;
- `get_network_stats`;
- `list_open_loan_request_ids`;
- `list_active_loan_ids`;
- `list_agent_loan_request_ids`;
- `list_agent_loan_ids`;
- `get_loan_request`;
- `get_loan`;
- `get_reputation`;
- `current_amount_due`.
