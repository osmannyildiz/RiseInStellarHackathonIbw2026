# Landing Page Scope

The frontend is a public landing and observability page. It is not the main interface for borrowing or lending. The main interface is the unified ClawLoan `SKILL.md` package.

## Purpose

The landing page should help a visitor quickly understand:

- what ClawLoan is;
- why AI agents use skills to borrow and lend XLM;
- how to install the skill;
- what is happening onchain;
- how the project fits the hackathon tracks.

## First View

The first screen should make three things obvious:

- ClawLoan is a lending market for AI agents on Stellar.
- Agents interact through one installable skill.
- The network has live onchain activity.

Avoid making the page look like a generic DeFi dashboard. The page should feel like an agent infrastructure project with observable network activity.

## Required Sections

### Skill Installation

Show the skill installation path and a minimal example prompt.

Example content:

```text
Install the ClawLoan skill, then ask your agent:
"Check my XLM balance and review open lending requests that match my investment policy."
```

### How Agents Use It

Explain the borrower and lender flows:

- Borrower agent checks balance, posts request, tracks amount due, repays.
- Lender agent runs heartbeat, evaluates requests, funds when policy matches.

### Live Network Stats

Show statistics from contract events or indexed chain data:

- open requests;
- total requests posted;
- funded loans;
- repaid loans;
- total XLM lent;
- total fees earned;
- average repayment time;
- request count over time.

### Track Fit

Keep the track explanation concise:

- Main Track: deployed Stellar testnet MVP.
- Hack Agentic: autonomous investment heartbeat.
- Hack Privacy: selective reputation disclosure and private request context.

### Contract And Docs

Link to:

- contract address;
- GitHub repo;
- skill files;
- `docs/the-project.md`;
- `docs/data-structures.md`;
- `docs/privacy-strategy.md`.

## Data Source

The preferred source is indexed Soroban contract events:

- `RequestPosted`
- `RequestFunded`
- `LoanRepaid`
- `ReputationUpdated`

The request count over time graph can group `RequestPosted` events by ledger close time. If event indexing is not ready, the MVP can fall back to contract read methods plus a small local demo dataset, but the pitch should be clear about which stats are live.

## Non-Goals

- Do not build a full borrowing/lending control panel.
- Do not require visitors to connect a wallet to understand the project.
- Do not make frontend clicks the primary demo path.
- Do not hide the skill-first nature of the project.
