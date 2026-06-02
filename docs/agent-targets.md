# Candidate Agent Targets

ClawLoan should target agents that can read an installed `SKILL.md`, keep wallet/config values available, run Stellar commands or helper scripts, and produce a visible decision log.

The initial candidates are:

- OpenClaw;
- Hermes Agent;
- PicoClaw.

These are candidates, not guaranteed integrations. Each one must pass the validation checklist before the project depends on it for the live run.

## Required Agent Features

ClawLoan needs each target agent to support:

- installable skill instructions through `SKILL.md` or an equivalent mechanism;
- terminal, script, MCP, or plugin access for Stellar contract calls;
- a way to run the Investment Heartbeat periodically or on operator trigger;
- persistent configuration for wallet identity, Lender Policy, and testnet values;
- visible logs or chat output for the lending decision.

## Current Recommendation

Use one primary target first, then add a second target only after the contract and skill flow work end to end.

Recommended order:

1. Validate OpenClaw first if its `HEARTBEAT.md` flow is available in the local setup.
2. Validate Hermes Agent as the second target if it can load the unified skill and run the helper scripts.
3. Treat PicoClaw as secondary until install, skill loading, wallet command execution, and heartbeat behavior are tested hands-on.

The project should not claim broad agent interoperability until at least two agents complete the same Loan Request, funding, and repayment flow on Stellar testnet.

## Compatibility Notes

| Agent | Status | What To Validate |
| --- | --- | --- |
| OpenClaw | Candidate primary target. | Skill loading, `HEARTBEAT.md` behavior, command execution, wallet config, decision logging. |
| Hermes Agent | Candidate secondary target. | Skill loading, scheduled or operator-triggered heartbeat, helper script execution, wallet config, decision logging. |
| PicoClaw | Candidate stretch target. | Skill installation, skill discovery, heartbeat behavior, command execution, and current project maturity. |

## Skill Packaging Implication

The ClawLoan skill should stay portable:

- Keep `SKILL.md` concise and mostly plain Markdown.
- Put runtime-specific setup in `references/agent-targets.md`.
- Avoid required frontmatter or commands that only one agent supports.
- Put contract calls behind small scripts or clearly named commands.
- Keep wallet setup, contract IDs, and testnet values in references that agents can read.

## Validation Checklist

For each target agent:

- Install the unified ClawLoan skill.
- Confirm the agent can discover and load the skill.
- Confirm the agent can read the skill references.
- Confirm wallet and contract config values can be set without exposing mainnet credentials.
- Confirm the agent can run a contract read command.
- Confirm the agent can run a contract write command with explicit approval or testnet-only credentials.
- Confirm heartbeat or operator-triggered scanning can inspect open Loan Requests.
- Confirm the agent can produce a visible decision log before funding.
- Confirm the full borrow, fund, repay flow works on Stellar testnet.

## Demo Recommendation

For the first reliable live run, use the smallest setup that demonstrates the product:

- one Borrower Agent;
- one Lender Agent;
- one unified ClawLoan skill;
- one Loan Request;
- one funding transaction;
- one repayment transaction;
- visible decision logs and contract-backed stats.

If two agent runtimes pass validation, use two real agents. If only one runtime is stable, use two configured agents inside that runtime and describe multi-runtime support as future validation work.
