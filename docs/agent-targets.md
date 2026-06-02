# Initial Agent Targets

ClawLoan should initially target real agents that can load a `SKILL.md`, run periodic or scheduled checks, and call the tooling needed to interact with Stellar.

Recommended initial targets:

- OpenClaw;
- Hermes Agent;
- PicoClaw.

## Required Agent Features

ClawLoan needs each target agent to support:

- installable skill instructions through `SKILL.md` or equivalent;
- terminal, script, MCP, or plugin access for Stellar contract calls;
- scheduled or heartbeat-style autonomous checks;
- persistent configuration for wallet identity, policy, and demo values;
- enough logging or messaging to show agent reasoning during the demo.

## Compatibility Matrix

| Agent | Skill support | Heartbeat / schedule | Tooling surface | Fit | Notes |
| --- | --- | --- | --- | --- | --- |
| OpenClaw | Yes. Skills are directories containing `SKILL.md`, loaded globally or from a workspace. | Yes. `HEARTBEAT.md` supports periodic awareness. | Strong. Runtime tools, files, web, browser, messaging, automation, plugins, and tool policy are documented. | Primary target. | Best match for the ClawLoan concept because the heartbeat model maps directly to autonomous investment checks. |
| Hermes Agent | Yes. Skills live under `~/.hermes/skills/`, support progressive disclosure, slash commands, references, scripts, required env vars, and external skill dirs. | Yes, through built-in cron and scheduled automations rather than the exact OpenClaw `HEARTBEAT.md` pattern. | Strong. Terminal/files, cronjob, messaging, MCP, and container backends are documented. | Primary target. | Good for a polished real-agent demo because skills, terminal access, cron, MCP, and messaging are all first-class. |
| PicoClaw | Likely yes. Public docs and repo references show skill installation and `SKILL.md`-style skill usage, but the documentation is thinner than OpenClaw/Hermes. | Yes. Heartbeat reads `workspace/HEARTBEAT.md`; minimum documented interval is 5 minutes. | Moderate. Repo references MCP commands and skill commands; docs emphasize lightweight operation and early-stage status. | Secondary target until tested. | Good hackathon story because it is lightweight, but we should validate install, skill loading, wallet command execution, and heartbeat behavior before relying on it live. |

## Target Recommendation

Use OpenClaw and Hermes Agent as the first demo targets. They both have enough documented support for skills, scheduled/autonomous behavior, and tool execution.

Treat PicoClaw as a stretch or secondary demo target until we run a hands-on compatibility test. It appears to support the core concepts, but its public docs are less complete and the project warns that it is still pre-1.0.

## Skill Packaging Implication

The ClawLoan skill should be portable:

- Keep `SKILL.md` concise and mostly plain Markdown.
- Put runtime-specific setup in `references/agent-targets.md`.
- Avoid relying on one agent's proprietary frontmatter unless optional.
- Provide separate setup snippets for OpenClaw, Hermes Agent, and PicoClaw.
- Keep contract calls behind small scripts or clearly named commands so each agent can execute them through its available terminal/tooling surface.

## Demo Recommendation

For the live demo:

1. Start with OpenClaw because the `HEARTBEAT.md` analogy is central to the Agentic track.
2. Show that the same unified ClawLoan skill can also be installed in Hermes Agent.
3. Mention PicoClaw as a planned lightweight target if we have not completed hands-on validation.

If time permits, use two real agents:

- Borrower: Hermes Agent using the ClawLoan skill to post and repay.
- Lender: OpenClaw using the ClawLoan skill plus `HEARTBEAT.md` to discover and fund.

This makes interoperability visible without forcing us to support three live runtimes in a five-minute presentation.

## Hands-On Validation Checklist

For each target agent:

- Install the unified ClawLoan skill.
- Confirm the agent can discover and load the skill.
- Confirm the agent can read the skill references.
- Confirm environment variables or config values can be set for wallet and contract details.
- Confirm the agent can run a contract read command.
- Confirm the agent can run a contract write command with explicit approval or demo credentials.
- Confirm heartbeat or schedule can trigger request scanning.
- Confirm the agent can produce a visible decision log.

## Source Notes

Research checked on June 3, 2026:

- OpenClaw Skills docs: skills are `SKILL.md` directories under global or workspace paths, with safety constraints and debugging commands.
- OpenClaw Heartbeat docs: heartbeat reads `HEARTBEAT.md` and runs periodic awareness checks.
- OpenClaw tools overview: tools include runtime command execution, files, web, browser, messaging, automation, and plugins.
- Hermes Agent docs: skills live under `~/.hermes/skills/`, support progressive disclosure, references, scripts, external skill directories, slash commands, required environment variables, terminal/files, cronjob, MCP, and container backends.
- PicoClaw docs and repo: heartbeat reads `workspace/HEARTBEAT.md`; repo command list includes `picoclaw skills install`, `picoclaw skills list`, and MCP commands. PicoClaw also warns it is still early-stage and should not be treated as production-ready before v1.0.
