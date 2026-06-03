# Target-Agent Notes

ClawLoan is designed as one portable skill that can be loaded by compatible agents. Do not claim a target runtime is validated until it completes the validation checklist below on Stellar testnet.

## Candidate Order

1. OpenClaw: primary candidate when its `HEARTBEAT.md` flow is available.
2. Hermes Agent: secondary candidate after the OpenClaw flow works end to end.
3. PicoClaw: stretch target until install, skill loading, wallet command execution, and heartbeat behavior are tested.

As of June 3, 2026, this repository does not include local OpenClaw, Hermes Agent, PicoClaw, or `HEARTBEAT.md` runtime files. Keep this skill runtime-portable and use helper commands rather than runtime-specific APIs.

## Required Runtime Features

A target agent must support:

- installable skill instructions through `SKILL.md` or equivalent;
- terminal, script, MCP, or plugin access for Stellar helper commands;
- persistent testnet wallet/config values;
- operator approval for write transactions where the runtime requires it;
- visible decision logs before autonomous lending actions;
- heartbeat scheduling or operator-triggered heartbeat execution.

## Validation Checklist

For each target agent:

- install the unified ClawLoan skill;
- confirm the agent can discover and load it;
- confirm the agent can read references;
- configure testnet wallet and contract values without exposing mainnet credentials;
- run one contract read;
- run one contract write with testnet credentials and proper approval;
- inspect open Loan Requests;
- produce a visible decision log before funding;
- complete borrow, fund, and repay on Stellar testnet.

## Demo Fallback

If two separate runtimes are not validated, use one stable runtime with two configured identities: one Borrower Agent and one Lender Agent.

If no runtime is validated, run helper commands directly while showing the skill instructions and heartbeat decision logs as the agent interface contract.

