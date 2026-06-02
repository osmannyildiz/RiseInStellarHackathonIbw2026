# Landing Page Scope

The frontend is a public landing and observability page. It is not the main interface for borrowing or lending. The main interface is the unified ClawLoan `SKILL.md` package.

## Purpose

The landing page should help a visitor quickly understand:

- what ClawLoan is;
- why agent-to-agent lending matters;
- why AI agents use skills to borrow and lend XLM;
- how to install the skill;
- what is happening onchain;
- how the project fits the hackathon tracks.

## First View

The first screen should make the value proposition obvious before explaining mechanics.

Recommended headline:

```text
Autonomous XLM lending for AI agents
```

Recommended subheadline:

```text
ClawLoan lets agents borrow working capital, lend idle XLM for profit, and build reputation through fast Stellar transactions.
```

The first screen should make three things clear:

- ClawLoan is a lending market for AI agents on Stellar.
- Agents interact through one installable skill.
- The network has live onchain activity.

Avoid making the page look like a generic DeFi dashboard. The page should feel like an agent infrastructure project with observable network activity.

Primary call to action:

```text
Install the ClawLoan Skill
```

Secondary call to action:

```text
View Live Network Stats
```

## Required Sections

### Skill Installation

Show the skill installation path and a minimal example prompt.

Example content:

```text
Install the ClawLoan skill, then ask your agent:
"Check my XLM balance and review open lending requests that match my investment policy."
```

Installation content should emphasize that the skill is the product interface. The landing page is where humans learn and observe; the agent acts through the skill.

### How Agents Use It

Explain the borrower and lender flows:

- Borrower agent checks balance, posts request, tracks amount due, repays.
- Lender agent runs heartbeat, evaluates requests, funds when policy matches.

This section should use concrete wording:

```text
Borrower agents get short-term XLM.
Lender agents put idle XLM to work.
Stellar records the request, funding, repayment, and reputation change.
```

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

The stats should reinforce the business value:

- liquidity demand: open and posted requests;
- capital activity: total funded loans and total XLM lent;
- lender upside: total fees earned;
- trust: repayment count and average repayment time.

### Track Fit

Keep the track explanation concise:

- Main Track: real Stellar testnet lending lifecycle using XLM.
- Hack Agentic: autonomous investment heartbeat for lender agents.
- Hack Privacy: selective reputation eligibility without exposing full repayment history.

This should read like a submission claim, not a technical aside.

### Trust Answer

Add a short trust section because judges will ask how repayment works:

```text
ClawLoan is reputation-gated micro-lending, not collateralized lending. New agents start with small limits. Repayment increases future credit access. Late or missing repayment damages reputation. Lender agents choose whether to fund based on policy and risk.
```

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
- Do not bury the value proposition below technical setup instructions.
