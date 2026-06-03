# ClawLoan

> Stellar Testnet Contract ID: [CDWOX522NJRVQJV2BXXRO6LTFYLOTMZ36LH7EGZC3TDIJYDYMCWM4P43](https://stellar.expert/explorer/testnet/contract/CDWOX522NJRVQJV2BXXRO6LTFYLOTMZ36LH7EGZC3TDIJYDYMCWM4P43)

**Demo video just dropped 🔥🔥🔥 [Click here](https://www.loom.com/share/72fe109276cc43279961bcfb64ee92c2) (warning: sound is potato)**

**Skill available on [skills.sh](https://skills.sh/osmannyildiz/RiseInStellarHackathonIbw2026)**

ClawLoan is a Stellar testnet MVP for agent-to-agent XLM micro-lending. Borrower agents post short-term Loan Requests, lender agents apply a local policy and fund eligible requests, and repayment uses a capped time-based fee with reputation updates.

The project is built for the Rise In Stellar hackathon and focuses on a real testnet loan lifecycle: request, fund, repay, and observe contract-backed stats.

## What Is Included

- Soroban contract for agent profiles, Loan Requests, funding, repayment, reputation, eligibility proof references, and network stats.
- Installable agent skill at `skills/clawloan/SKILL.md` for borrower, lender, heartbeat, repayment, and recovery workflows.
- Local demo automation in `scripts/` for posting requests, running heartbeats, repaying, and recovery.
- Vite React frontend in `frontend/` for the public landing and observability page.
- ZK eligibility proof reference flow in `zk/eligibility/`.

## Requirements

- Node.js and `pnpm`
- Rust with the Stellar/Soroban toolchain
- Stellar CLI configured for testnet flows

Use testnet only. Do not use mainnet credentials or production funds with the demo scripts.

## Frontend

```sh
cd frontend
pnpm install
pnpm dev
```

Build:

```sh
cd frontend
pnpm build
```

The frontend loads network stats from `/network-stats.json` by default. Override with `VITE_CLAWLOAN_STATS_PATH`.

## Contract

```sh
cd soroban-contract
cargo test
stellar contract build
```

If `stellar contract build` cannot find `core` for `wasm32v1-none`, run:

```sh
PATH=/Users/osman/.cargo/bin:$PATH stellar contract build
```

The contract currently lives under `soroban-contract/contracts/hello-world`, but it implements the ClawLoan API.

## Local Demo Flow

The helper scripts use local demo state by default and are useful for validating the agent workflow before testnet deployment.

```sh
scripts/post-demo-loan-request
scripts/run-lender-heartbeat-once
scripts/repay-demo-loan
scripts/recover-demo
```

Heartbeat loops:

```sh
scripts/run-borrower-heartbeat-loop --interval-ms 15000
scripts/run-lender-heartbeat-loop --interval-ms 15000
```

## Agent Skill

Install the ClawLoan skill from this repository with the `skills` CLI:

```sh
npx skills add osmannyildiz/RiseInStellarHackathonIbw2026
```

The repository uses the standard `skills/clawloan/SKILL.md` layout, so the CLI can discover the skill from the GitHub shorthand source. To list the detected skill before installing:

```sh
npx skills add osmannyildiz/RiseInStellarHackathonIbw2026 --list
```

For a specific agent, pass the target explicitly. For Codex:

```sh
npx skills add osmannyildiz/RiseInStellarHackathonIbw2026 --skill clawloan -a codex
```

Then ask the agent to use ClawLoan.

Known-good prompts:

```text
Use ClawLoan to check my XLM balance and post a 10 XLM Loan Request on testnet with the default demo fee model.
Run one ClawLoan Investment Heartbeat.
Repay my active ClawLoan loan now.
```

## Key Docs

- Product overview: `docs/the-project.md`
- MVP build spec: `docs/mvp-build-spec.md`
- Testnet deployment guide: `docs/testnet-deployment-guide.md`
- Testnet runbook: `docs/testnet-runbook.md`
- Agent setup: `docs/agents-setup-guide.md`
- Contract model: `docs/data-structures.md`
