# ClawLoan — Agent Setup Guide

> Quick-start for **OpenClaw** (primary) and **Hermes Agent** (secondary).
> Validate OpenClaw first; add Hermes only after the full borrow → fund → repay flow works end-to-end.

---

## 1. OpenClaw (Primary Target)

### Install

```bash
# macOS / Linux / WSL2
curl -fsSL https://openclaw.ai/install.sh | bash

# Post-install: configure model provider & gateway
openclaw onboard --install-daemon
```

### Load the ClawLoan Skill

Copy the unified skill into the OpenClaw skills directory:

```bash
cp -r skills/clawloan ~/.openclaw/skills/clawloan
```

Or install from ClawHub if published:

```bash
clawhub install clawloan
```

Verify the agent discovers the skill:

```
> "List your installed skills."
# Agent should list `clawloan` with its description.
```

### Wallet & Testnet Config

1. Run `setup-testnet-accounts` to create borrower + lender identities.
2. Write wallet identifiers and the contract ID into `skills/clawloan/references/demo-values.md`.
3. Run `configure-demo` — this syncs contract ID, token address, agent IDs, and fee defaults into skill references and frontend env.

> [!IMPORTANT]
> Never place mainnet credentials in testnet config. OpenClaw has system-level access — sandbox or use a dedicated test machine.

### Heartbeat Setup

OpenClaw supports `HEARTBEAT.md` — a file the agent reads on a recurring schedule.

1. Create or update `~/.openclaw/HEARTBEAT.md` with the lender heartbeat instructions from the ClawLoan skill (check balance → review open requests → apply Lender Policy → fund or wait).
2. Configure interval in `openclaw.json`:

```json
{
  "heartbeat": {
    "enabled": true,
    "intervalMinutes": 5,
    "lightContext": true
  }
}
```

3. For the live demo, trigger manually instead of waiting for the interval:

```
> "Run one ClawLoan Investment Heartbeat."
```

### Run the Demo Flow

| Step | Prompt / Command | Expected Result |
|------|-----------------|-----------------|
| 1 | `"Use ClawLoan to check my XLM balance and post a 10 XLM Loan Request."` | Agent reports balance, confirms credit limit, posts request. |
| 2 | `"Run one ClawLoan Investment Heartbeat."` | Agent reports balance, reserve, best request, policy checks, fund decision. |
| 3 | `run-lender-heartbeat-once` | Funding tx hash, Loan ID, status `Active`. |
| 4 | `"Repay my active ClawLoan loan now."` | Repayment tx hash, fee paid, status `Repaid`. |

---

## 2. Hermes Agent (Secondary Target)

### Install

```bash
# macOS / Linux / WSL2
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Interactive setup wizard (LLM provider, API keys, gateways)
hermes setup

# Verify
hermes --version
```

### Load the ClawLoan Skill

Copy the skill folder into the Hermes skills directory:

```bash
cp -r skills/clawloan ~/.hermes/skills/clawloan
```

Or point Hermes to the project's skill directory:

```bash
hermes skills --add-dir ./skills
```

Verify:

```
> "List your skills."
# Should show `clawloan`.
```

### Wallet & Testnet Config

Same as OpenClaw — run `setup-testnet-accounts` and `configure-demo`. Hermes reads `SKILL.md` references the same way; just ensure the demo-values reference file is accessible from `~/.hermes/skills/clawloan/references/`.

### Heartbeat Setup

Hermes does **not** use `HEARTBEAT.md`. Instead, use one of:

- **Operator trigger** — manually prompt the heartbeat each time:
  ```
  > "Run one ClawLoan Investment Heartbeat."
  ```
- **Scheduled task** — if Hermes supports cron/scheduled workflows, configure a recurring prompt. Otherwise, use an external scheduler (cron / `launchd`) that sends the heartbeat prompt via Hermes's Telegram/Slack gateway.

### Run the Demo Flow

Same four steps as OpenClaw above — the skill instructions and helper scripts are runtime-portable.

---

## 3. Validation Checklist (Both Agents)

Every agent must pass **all** items before claiming support:

- [ ] Install the unified ClawLoan skill
- [ ] Agent discovers and loads the skill
- [ ] Agent can read skill references (`contract.md`, `demo-values.md`, `commands.md`)
- [ ] Wallet and contract config values can be set without exposing mainnet credentials
- [ ] Agent can run a **contract read** command (e.g., `get_network_stats`)
- [ ] Agent can run a **contract write** command with explicit approval (e.g., `post_loan_request`)
- [ ] Heartbeat or operator-triggered scan inspects open Loan Requests
- [ ] Agent produces a visible **decision log** before funding
- [ ] Full **borrow → fund → repay** flow completes on Stellar testnet

> [!TIP]
> If only one runtime passes validation by demo time, run **two configured agent identities** (borrower + lender) inside that single runtime. Describe multi-runtime support as future work.

---

## 4. Fallback Plan

| Situation | Action |
|-----------|--------|
| Only OpenClaw validated | Run borrower + lender as two identities in OpenClaw. |
| Only Hermes validated | Same — two identities in Hermes. |
| Neither validated in time | Use helper scripts directly (`post-demo-loan-request`, `run-lender-heartbeat-once`, `repay-demo-loan`) and present the skill + decision logs as the agent interface contract. |

---

## 5. Key File Paths

| File | Purpose |
|------|---------|
| `skills/clawloan/SKILL.md` | Unified skill — borrower + lender workflows |
| `skills/clawloan/references/` | Contract signatures, demo values, commands, privacy |
| `scripts/setup-testnet-accounts` | Create/fund borrower + lender testnet wallets |
| `scripts/deploy-contract` | Build & deploy Soroban contract |
| `scripts/configure-demo` | Sync contract ID + config into skill refs & frontend |
| `scripts/run-lender-heartbeat-once` | One-shot lender heartbeat |
| `scripts/repay-demo-loan` | Borrower repayment |
| `scripts/recover-demo` | List stale requests/loans, suggest recovery steps |
