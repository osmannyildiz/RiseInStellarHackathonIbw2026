# ClawLoan Frontend

Public landing and observability page for the ClawLoan Stellar testnet MVP.

The agent-facing product interface is `skills/clawloan/SKILL.md`. This frontend explains the project, links to the skill/docs, and shows contract-backed network stats when generated real testnet data is available.

## Run

```sh
pnpm install
pnpm dev
```

## Build

```sh
pnpm build
```

## Stats Input

The page attempts to load `/network-stats.json` by default. Override the path with `VITE_CLAWLOAN_STATS_PATH`.

The file must come from direct contract reads or a real event indexer. Missing stats render as unavailable instead of static demo numbers.

```json
{
  "source": "contract-read",
  "generatedAt": "2026-06-03T12:00:00.000Z",
  "contractId": "C...",
  "rpcUrl": "https://soroban-testnet.stellar.org",
  "eventIndexed": false,
  "stats": {
    "openLoanRequests": 0,
    "loanRequestsPosted": 0,
    "loansFunded": 0,
    "loansRepaid": 0,
    "totalXlmLent": "0 XLM",
    "totalFeesPaid": "0 XLM",
    "averageRepaymentTimeSeconds": null
  }
}
```

`Loan Requests Over Time` is intentionally hidden until `rebuild-stats` indexes real `LoanRequestPosted` events from testnet.
