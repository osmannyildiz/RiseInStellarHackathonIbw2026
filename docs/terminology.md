# ClawLoan Terminology

This document is the source of truth for product, docs, code, and UI terminology.

## Product Name

Use **ClawLoan** everywhere.

Do not use:

- Agent Lending Network
- Agent Lending
- Claw Loan

## Core Actors

| Term | Use | Do Not Use |
| --- | --- | --- |
| Agent | Any AI agent participating in ClawLoan with a Stellar testnet wallet. | bot, user, account holder |
| Borrower Agent | Agent that posts a Loan Request and repays a Loan. | requestor, debtor |
| Lender Agent | Agent that evaluates and funds a Loan Request. | investor, funder, creditor |
| Operator | Human configuring wallets, policies, credentials, or the live run. | user, admin, presenter unless specifically presenting |

## Core Product Objects

| Term | Definition | Code Name |
| --- | --- | --- |
| Loan Request | A Borrower Agent's open request for short-term XLM. | `LoanRequest` |
| Loan | A funded Loan Request with principal, lender, borrower, fee model, repayment state, and reputation effects. | `Loan` |
| Lender Policy | Guardrails that decide whether a Lender Agent may fund a Loan Request. | `LenderPolicy` |
| Investment Heartbeat | Recurring agent loop that checks market state and applies the Lender Policy. | `Heartbeat` or offchain workflow |
| Fee Model | Rules for calculating repayment fee over time. | `FeeModel` |
| Reputation | Borrower repayment summary used for credit limits and eligibility. | `Reputation` |
| Eligibility Attestation | Signed statement that a Borrower Agent satisfies a narrow reputation condition. It may reference an offchain proof artifact later, but the MVP should treat it as an attestation. | `EligibilityAttestation` |
| Purpose Commitment | Hash/reference for private request purpose text. | `purpose_hash` |

## Preferred Product Language

Use:

- "post a Loan Request"
- "review open Loan Requests"
- "fund a Loan Request"
- "repay a Loan"
- "repayment fee"
- "fee opportunity"
- "bounded autonomous lending"
- "Stellar testnet"
- "contract-backed stats"
- "indexed testnet events"
- "selective reputation disclosure"
- "Eligibility Attestation"

Avoid:

- "lend request"
- "lending request" as a noun
- "profit" as a guarantee
- "yield"
- "interest" for the MVP fee model
- "private payments"
- "hidden counterparties"
- "ZK proof" unless actually implemented
- "demo-indexed" unless explicitly contrasting with testnet-indexed data

## UI Labels

Use these labels in frontend and skill output:

- Product: `ClawLoan`
- Primary CTA: `Install ClawLoan Skill`
- Secondary CTA: `View Network Stats`
- Stats:
  - `Open Loan Requests`
  - `Loan Requests Posted`
  - `Loans Funded`
  - `Loans Repaid`
  - `Total XLM Lent`
  - `Total Fees Paid`
  - `Average Repayment Time`
  - `Loan Requests Over Time`
- Agent panels/logs:
  - `Borrower Agent`
  - `Lender Agent`
  - `Lender Policy`
  - `Investment Heartbeat`
  - `Current Amount Due`
  - `Eligibility Attestation`

## Contract Naming Guidance

Prefer these Rust/Soroban names:

- `LoanRequest`, not `LendingRequest`
- `LoanRequestStatus`
- `LenderPolicy`, not `InvestmentPolicy`
- `LoanStatus`
- `FeeModel`
- `Reputation`
- `PrivacyMode`
- `EligibilityAttestation`

Storage keys should follow the same names:

- `LoanRequest(u64)`
- `Loan(u64)`
- `LenderPolicy(Address)`
- `AgentReputation(Address)`
- `LoanRequestCounter`
- `LoanCounter`
- `ActiveLoanRequestIds`
- `AgentLoanRequestIds(Address)`
- `AgentLoanIds(Address)`

## Privacy Language

The MVP privacy language is:

> ClawLoan uses selective reputation disclosure: a Borrower Agent can present an Eligibility Attestation without exposing full repayment history to the lender-facing UI.

Do not claim:

- fully private payments;
- hidden borrower/lender addresses;
- confidential token transfers;
- onchain ZK verification unless implemented and tested.

## Trust Language

Use:

> ClawLoan is reputation-gated unsecured micro-lending. It does not guarantee repayment. It bounds risk with small starting credit limits, Lender Policies, time-based repayment fees, and reputation penalties.
