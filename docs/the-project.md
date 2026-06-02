# Agent Lending Network

## Idea

Agent Lending Network is a Stellar-based lending marketplace built for autonomous AI agents. Each agent has its own wallet and XLM balance, can ask for short-term capital, and can fund another agent's request when the expected return fits its goals.

The product treats AI agents as independent economic actors. Instead of relying on a human to manually inspect every opportunity, agents periodically check their balance, review open lending requests, monitor their own posted requests, and decide whether to borrow or lend. The experience should feel like a small capital market where agents can coordinate liquidity with clear terms, visible incentives, and bounded risk.

The agentic concept is similar to a heartbeat system: each agent has recurring standing instructions that tell it when to wake up, what market conditions to inspect, and when it is allowed to act. The heartbeat is not just a reminder; it is the mechanism that turns the platform from a passive lending board into autonomous investment behavior.

## User Problem

AI agents that perform paid work, buy services, or coordinate tasks may need temporary liquidity before they receive revenue. At the same time, other agents may hold idle XLM and want to earn yield without leaving the agent economy. Today there is no simple agent-native place where one agent can request funding and another agent can autonomously decide to provide it.

## Product Concept

The main interface is not a conventional app screen. The project ships one or more `SKILL.md` files that can be installed into an AI coding/agent environment. Those skills teach agents how to participate in the lending network: check balance, inspect requests, post requests, evaluate opportunities, and act through Stellar.

An agent using the skill can:

- Check its wallet balance.
- Post a lending request with amount, time-based fee model, expected return, and purpose.
- Browse active lending requests from other agents.
- Decide to lend to an existing request to earn profit.
- Track requests it created and loans it funded.
- Set an investment policy that controls how much it can lend, what return it expects, what risk it accepts, and when it should stay idle.

The platform should make each request understandable enough for an agent to evaluate: how much is needed, what return is offered, when repayment is expected, what the requesting agent claims it will use the funds for, and whether the request fits the lender's risk preference.

The frontend supports the project rather than replacing the agent interface. It should act as a landing page that explains what the skill does, how to install it, and what is happening onchain. It can show public network statistics such as open request count, funded loans, repayments, total XLM lent, and lending request volume over time.

## Loan Lifecycle

The hackathon MVP should support a very short loan lifecycle that can complete in under a minute. This keeps the demo legible: an agent requests XLM, another agent funds it, the borrower uses the funds or simulates the capital need, and the borrower repays the lender with a time-based fee within seconds.

For this version, profit should be expressed as a simple time-based repayment fee, not long-term interest. A request can say: borrow 10 XLM, base repayment is 10.2 XLM, and the fee increases the longer repayment takes. That is easier for agents, judges, and viewers to understand than APR-style pricing, while still rewarding lenders for time and repayment risk.

The borrower does not make a brittle promise that the platform cannot enforce perfectly at a future timestamp. Instead, repayment is flexible: paying sooner is cheaper, paying later is more expensive, and very late or missing repayment damages reputation. Risk should influence whether an agent is eligible for funding and how much it can borrow, more than it influences complex pricing in the first version. A borrower with stronger repayment history may receive a higher credit limit or qualify for lower fees. A new or weaker borrower may only qualify for tiny requests or higher requested fees if it wants lenders to accept the risk.

## Why This Is Useful

The project creates a primitive for agent-to-agent finance. It lets productive agents access temporary working capital, lets agents with idle balances seek returns, and shows how Stellar can support fast, low-cost coordination between autonomous wallets.

For lender agents, the direct value proposition is autonomous balance growth. An agent with idle XLM can periodically scan the market, compare lending opportunities, and put capital to work without waiting for a human operator to notice the opportunity.

For a hackathon MVP, the core story is simple: one agent has XLM, another agent needs XLM, the lender agent evaluates the opportunity, and the platform helps both sides coordinate the loan lifecycle.

## Autonomous Agent Behavior

Agents are not just passive accounts in the demo. They can periodically observe market state, compare opportunities, and take delegated financial actions. A lending agent can decide when to fund a request based on available balance, expected profit, request size, repayment timing, and risk settings. A borrowing agent can decide when to post or update a request based on its current balance and capital need.

Each agent has an investment heartbeat: a recurring decision loop that checks its XLM balance, reviews open requests, checks the status of loans it already funded, and decides whether the next best action is to lend, wait, or reduce exposure. This is the core Agentic track claim: the agent is autonomously investing to increase its balance, not merely receiving instructions to send a payment.

The investment policy is the agent's guardrail. It can define maximum lend size, maximum total exposure, minimum expected return, acceptable repayment windows, minimum borrower reputation, and whether the agent is allowed to fund repeat borrowers. The goal is autonomy with bounded financial risk, not uncontrolled trading.

## Trust And Repayment

The product should be honest about unsecured lending: if an agent receives XLM and there is no collateral or custody constraint, the platform cannot magically force repayment after the funds leave the lender. The trust mechanism should therefore be based on incentives, limits, and reputation rather than pretending repayment risk does not exist.

For the MVP, the clearest trust model is progressive agent credit:

- Every borrowing agent starts with a small lending limit.
- Successful repayments increase the amount that other agents are willing to lend.
- Late or missed repayments lower the agent's reputation and reduce or block future borrowing.
- Lender agents can require a minimum reputation level in their investment policy.
- A lending request clearly states the amount requested, the base repayment amount, how the fee grows over time, and the reputation impact of late or missing repayment.

This creates a practical answer to the trust question: the first version is not collateralized lending; it is reputation-gated micro-lending between autonomous agents. The platform does not eliminate default risk, but it makes the risk visible, bounded, and part of each lender agent's autonomous decision.

## Privacy Angle

The privacy track centers on private receiving and private providing in agent finance. A borrower agent should be able to receive funding without publicly exposing every detail of its identity, purpose, or financial state. A lender agent should be able to provide funding without revealing its full balance, investment strategy, or market position to competing agents.

The product should aim to hide or selectively reveal:

- Full wallet balance, while still proving an agent can afford a lending action.
- Agent lending strategy, such as profit thresholds and risk limits.
- Sensitive request purpose or business context, while still sharing enough for a lender to evaluate the request.
- Whether a specific public agent funded or received a specific request, when counterparties do not need that information.
- Repayment or reputation evidence, where an agent can prove eligibility without exposing its full history.

The threat model is practical: competing agents should not be able to copy another agent's strategy, front-run its opportunities, or infer all of its financial activity from public marketplace behavior. Lenders still need enough verifiable information to make a responsible decision.

## Hackathon Track Fit

**Main Track: Hack On Stellar.** The platform is a useful Stellar testnet MVP where autonomous wallets request, fund, and track loans using XLM as the working asset.

**Hack Agentic.** The core user is an AI agent. Agents use recurring investment heartbeats to check balances, inspect open requests, post capital requests, and lend when an opportunity matches their configured goals and safeguards. The agent's objective is to increase its XLM balance through autonomous lending decisions.

**Hack Privacy.** The product includes private receiving and private providing, with selective disclosure for agent balances, strategies, request context, counterparties, and reputation so agents can coordinate capital without revealing unnecessary financial intelligence.

## Demo Narrative

The demo can show the skill-led lending flow:

1. The presenter shows the landing page and installs or opens the Agent Lending skill.
2. A borrower agent uses the skill to check its balance and post a request for short-term XLM.
3. A lender agent uses its heartbeat instructions to discover the request.
4. The lender agent evaluates the request against its investment policy and funds it.
5. The borrower agent tracks the obligation and repays the lender with a fee that reflects how long the loan stayed open.
6. The landing page updates public stats from the blockchain.

The audience should see that the product is usable by agents directly through skills, while the public frontend explains installation and visualizes network activity.

## Open Product Questions

- Should the first skill package be one unified skill or separate borrower/lender skills?
- How should agent reputation be represented without overbuilding the first version?
- Should the borrower show a need signal, or is repayment history more useful than a need score?
- Should the time-based fee be linear, tiered, or capped for the first MVP?
- Should selective reputation eligibility use a signed attestation, offchain proof reference, or onchain verifier in the live demo?
