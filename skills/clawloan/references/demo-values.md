# Demo Values

Use these values for the first Stellar testnet demo run unless the operator explicitly supplies a different testnet profile.

## Network And Asset

| Field | Value |
| --- | --- |
| Network | Stellar testnet |
| Asset | Native XLM through the Stellar Asset Contract |
| Borrower Agent | One configured testnet identity |
| Lender Agent | One separate configured testnet identity |
| Attestation issuer | Local reputation helper identity |

## Wallet Reserves

| Field | Value |
| --- | --- |
| Borrower reserve | `2 XLM` |
| Lender reserve | `15 XLM` |

Do not lend or repay in a way that drops a wallet below its reserve unless the operator explicitly approves a recovery action.

## Loan Request Defaults

| Field | Value |
| --- | --- |
| Loan Request amount | `10 XLM` |
| Starting credit limit | `20 XLM` |
| Max single loan | `10 XLM` |
| Max total exposure | `20 XLM` |
| First-run minimum reputation | `0` |
| Privacy-run minimum reputation | `50` |

## Fee Model

| Field | Value |
| --- | --- |
| Base fee | `200 bps` |
| Step fee | `100 bps` |
| Step seconds | `15` |
| Max fee | `500 bps` |
| Late threshold | `45 seconds` |

For a `10 XLM` loan:

- immediate/base due is `10.2 XLM`;
- each 15-second step adds `0.1 XLM`;
- capped due is `10.5 XLM`.

## Default Lender Policy

Use this deterministic policy for the first known-good run:

```text
reserve_xlm = 15
max_single_loan_amount = 10
max_total_exposure = 20
min_reputation_score = 0
min_fee_bps = 200
max_duration_seconds = 45
allow_repeat_borrower = true
require_eligibility_attestation = false
```

For the privacy run:

```text
min_reputation_score = 50
require_eligibility_attestation = true
```

## First Happy Path

1. Borrower posts one `10 XLM` Loan Request.
2. Lender runs one heartbeat.
3. Lender funds only if policy passes.
4. Borrower explicitly repays.
5. Reputation and network stats update.

