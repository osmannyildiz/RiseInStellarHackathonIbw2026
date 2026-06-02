# ClawLoan

## One-Liner

ClawLoan lets AI agents borrow and lend XLM to each other through a real Stellar testnet loan lifecycle, so idle agent balances can become autonomous working capital instead of sitting unused.

## Idea

ClawLoan is a Stellar-based lending marketplace built for autonomous AI agents. Each agent has its own wallet and XLM balance, can ask for short-term capital, and can fund another agent's request when the expected fee and risk fit its goals.

The product treats AI agents as independent economic actors. Instead of relying on a human to manually inspect every opportunity, agents periodically check their balance, review open Loan Requests, monitor their own posted requests, and decide whether to borrow or lend. The experience should feel like a small capital market where agents can coordinate liquidity with clear terms, visible incentives, and bounded risk.

The agentic concept is similar to a heartbeat system: each agent has recurring standing instructions that tell it when to wake up, what market conditions to inspect, and when it is allowed to act. The heartbeat is not just a reminder; it is the mechanism that turns the platform from a passive lending board into autonomous investment behavior.

In the demo, the audience should understand the product in one sentence: one agent needs XLM, another agent has idle XLM, and ClawLoan lets them coordinate a short loan on Stellar with the lender decision driven by an agent policy rather than a human manually choosing every opportunity.

## User Problem

AI agents that perform paid work, buy services, or coordinate tasks may need temporary liquidity before they receive revenue. At the same time, other agents may hold idle XLM and want fee opportunities without leaving the agent economy. Today there is no simple agent-native place where one agent can request funding and another agent can autonomously decide to provide it.

This becomes more important as agents start using wallets for real tasks. Wallet balances will not always line up perfectly with an agent's immediate need. Some agents will be temporarily short on XLM; others will be overfunded and idle. ClawLoan creates a simple market between those two states.

## Value Proposition

ClawLoan creates three clear forms of value:

- **For borrower agents:** instant short-term XLM when they need working capital.
- **For lender agents:** a way to put idle XLM to work through bounded autonomous lending decisions.
- **For builders:** a reusable primitive for agent-to-agent finance on Stellar.

The product is intentionally narrow. It does not try to become a full DeFi lending protocol in one hackathon. It proves a new agent-native behavior: agents can manage liquidity, evaluate risk, lend with a fee incentive, repay, and build reputation through onchain activity.

## Product Concept

The main interface is not a conventional app screen. The project ships one unified `SKILL.md` file that can be installed into an AI coding/agent environment. The skill teaches agents how to participate in the lending network: check balance, inspect requests, post Loan Requests, evaluate opportunities, and act through Stellar.

An agent using the skill can:

- Check its wallet balance.
- Post a Loan Request with amount, time-based fee model, expected fee, and purpose.
- Browse active Loan Requests from other agents.
- Decide to lend to an existing request for a fee opportunity if the borrower repays.
- Track requests it created and loans it funded.
- Set a Lender Policy that controls how much it can lend, what fee it expects, what risk it accepts, and when it should stay idle.

The platform should make each request understandable enough for an agent to evaluate: how much is needed, what fee is offered, how the repayment amount changes over time, what the requesting agent claims it will use the funds for, and whether the request fits the lender's risk preference.

The frontend supports the project rather than replacing the agent interface. It should act as a landing page that explains what the skill does, how to install it, and what testnet activity has happened. It can show contract-backed statistics such as Open Loan Requests, Loans Funded, Loans Repaid, Total XLM Lent, and Loan Requests Over Time. If a local indexer is used for charts, it should index real testnet contract events or transactions.

This makes ClawLoan easy to understand from two angles: agents use the skill to participate, while humans use the landing page to inspect the network and install the skill.

## Grounded Testnet MVP Scope

ClawLoan should be pitched and built around a functional Stellar testnet MVP:

- A Soroban contract for Loan Requests, funding, repayment, time-based fees, simple reputation, and events.
- One unified skill that teaches real agents how to use the contract and apply borrower/lender workflows.
- A lender heartbeat that can evaluate open Loan Requests and act within configured testnet wallet limits.
- Automation and convenience scripts that make the live run reliable, repeatable, and recoverable.
- A landing page that explains the skill and shows contract-backed stats from testnet activity.
- An Eligibility Attestation for selective reputation disclosure.

ClawLoan should not claim these as MVP deliverables:

- full private payments;
- hidden onchain counterparties;
- guaranteed repayment;
- production-grade credit scoring;
- collateralized lending;
- a complete DeFi protocol;
- an onchain ZK verifier unless it is actually implemented and tested.

## Loan Lifecycle

The testnet MVP should support a short loan lifecycle that can complete quickly enough for a live presentation, while still being a real contract flow. An agent requests XLM, another agent funds it, the borrower receives real testnet XLM for a testnet-safe purpose, and the borrower repays the lender with a time-based fee.

For this version, lender upside should be expressed as a simple time-based repayment fee, not long-term interest. A request can say: borrow 10 XLM, base repayment is 10.2 XLM, and the fee increases the longer repayment takes. That is easier for agents, judges, and viewers to understand than APR-style pricing, while still rewarding lenders for time and repayment risk.

The borrower does not make a brittle promise that the platform cannot enforce perfectly at a future timestamp. Instead, repayment is flexible: paying sooner is cheaper, paying later is more expensive, and very late or missing repayment damages reputation. Risk should influence whether an agent is eligible for funding and how much it can borrow, more than it influences complex pricing in the first version. A borrower with stronger repayment history may receive a higher credit limit or qualify for lower fees. A new or weaker borrower may only qualify for tiny requests or higher requested fees if it wants lenders to accept the risk.

## Why Stellar

Stellar is a strong fit because ClawLoan depends on fast, low-cost transactions and real wallet ownership. A short live loan lifecycle is only convincing if funding and repayment can happen quickly enough on testnet. Stellar testnet lets the project demonstrate real onchain payments, contract state, events, and balances without turning the demo into a slow settlement story.

The project creates a primitive for agent-to-agent finance. It lets productive agents access temporary working capital, lets agents with idle balances seek returns, and shows how Stellar can support fast, low-cost coordination between autonomous wallets.

For lender agents, the direct value proposition is an autonomous fee opportunity on idle XLM. An agent with idle XLM can periodically scan the market, compare lending opportunities, and put capital to work without waiting for a human operator to notice the opportunity.

For the MVP, the core story is simple: one agent has XLM, another agent needs XLM, the lender agent evaluates the opportunity, and the platform helps both sides coordinate the loan lifecycle.

## Autonomous Agent Behavior

Agents are not just passive accounts. They can periodically observe market state, compare opportunities, and take delegated financial actions using configured testnet wallets and limits. A lending agent can decide when to fund a Loan Request based on available balance, expected fee, request size, repayment timing, and risk settings. A borrowing agent can decide when to post or update a request based on its current balance and capital need.

Each agent has an Investment Heartbeat: a recurring decision loop that checks its XLM balance, reviews open Loan Requests, checks the status of loans it already funded, and decides whether the next best action is to lend, wait, or reduce exposure. This is the core Agentic track claim: the agent is autonomously investing to increase its balance, not merely receiving instructions to send a payment.

The Lender Policy is the agent's guardrail. It can define maximum lend size, maximum total exposure, minimum expected fee, acceptable repayment windows, minimum borrower reputation, and whether the agent is allowed to fund repeat borrowers. The goal is autonomy with bounded financial risk, not uncontrolled trading.

## Trust And Repayment

The product should be honest about unsecured lending: if an agent receives XLM and there is no collateral or custody constraint, the platform cannot magically force repayment after the funds leave the lender. The trust mechanism should therefore be based on incentives, limits, and reputation rather than pretending repayment risk does not exist.

For the MVP, the clearest trust model is progressive agent credit:

- Every borrowing agent starts with a small lending limit.
- Successful repayments increase the amount that other agents are willing to lend.
- Late or missed repayments lower the agent's reputation and reduce or block future borrowing.
- Lender agents can require a minimum reputation level in their Lender Policy.
- A Loan Request clearly states the amount requested, the base repayment amount, how the fee grows over time, and the reputation impact of late or missing repayment.

This creates a practical answer to the trust question: the first version is not collateralized lending; it is reputation-gated micro-lending between autonomous agents. The platform does not eliminate default risk, but it makes the risk visible, bounded, and part of each lender agent's autonomous decision.

## Privacy Angle

The privacy track centers on selective disclosure for reputation and request context, not fully private payments. Soroban storage and token transfers are public in the MVP, so ClawLoan should not claim to hide all counterparties or settlement activity. The grounded privacy claim is that a borrower can disclose only the eligibility facts needed for a lending decision, while keeping unnecessary repayment-history detail and private purpose text out of public contract storage.

The product should aim to hide or selectively reveal:

- Agent lending strategy, such as fee thresholds and risk limits, by keeping policy local to the lender skill unless voluntarily disclosed.
- Sensitive request purpose or business context, while still sharing enough for a lender to evaluate the request.
- Repayment or reputation evidence, where an agent can present eligibility without exposing its full history to the lender-facing UI.

The threat model is practical: competing agents should not get unnecessary access to another agent's full repayment history, private request purpose, or lending policy. The MVP does not prevent all chain analysis, and the pitch should say that clearly. Lenders still need enough verifiable information to make a responsible decision.

## Hackathon Track Fit

**Main Track: Hack On Stellar.** ClawLoan is a useful Stellar testnet MVP where autonomous wallets request, fund, repay, and track loans using XLM as the working asset. It uses Stellar for the part that matters: fast value movement and verifiable shared state.

**Hack Agentic.** The core user is an AI agent. Agents use recurring Investment Heartbeats to check balances, inspect open Loan Requests, post Loan Requests, and lend when an opportunity matches their configured goals and safeguards. The agent's objective is to increase its XLM balance through autonomous lending decisions.

**Hack Privacy.** ClawLoan uses selective reputation eligibility so a borrower can show enough to qualify for funding without exposing full repayment history or every prior loan to the lender or public UI. The privacy story is narrow, relevant, and tied directly to the trust problem judges will ask about. Full private settlement is out of scope for the hackathon MVP.

## Jury Appeal

ClawLoan is designed to be easy to judge:

- It has a concrete user: autonomous agents with wallets.
- It has a clear financial action: borrow and lend XLM.
- It has visible utility: idle agent balances can find fee opportunities, and underfunded agents can access working capital.
- It has real autonomy: lender agents make bounded investment decisions through a heartbeat.
- It has a credible trust model: progressive reputation-gated micro-lending, not hand-waved repayment.
- It has a focused privacy claim: selective reputation disclosure instead of vague "private finance."
- It has a live-run shape: a full loan can be created, funded, repaid, and reflected in stats during a five-minute presentation.

## Demo Narrative

The demo can show the skill-led lending flow:

1. The presenter shows the landing page and installs or opens the ClawLoan skill.
2. A borrower agent uses the skill to check its balance and post a Loan Request for short-term XLM.
3. A lender agent uses its heartbeat instructions to discover the request.
4. The lender agent evaluates the request against its Lender Policy and funds it.
5. The borrower agent tracks the obligation and repays the lender with a fee that reflects how long the loan stayed open.
6. The landing page updates public stats from contract data, with any local indexer reading real testnet activity.

The audience should see that the product is usable by agents directly through one unified skill, while the public frontend explains installation and visualizes network activity.

The strongest demo moment is the lender heartbeat: the agent wakes up, sees idle XLM, finds a borrower request, checks reputation and policy, funds the loan, and later sees repayment with a fee. That is the Agentic track story in one flow.

## MVP Decisions

- **Skill package:** one unified ClawLoan skill.
- **Trust model:** reputation-gated unsecured micro-lending with small starting limits.
- **Reputation model:** simple score, credit limit, repayment count, late count, default count, and open borrowed amount.
- **Borrower need signal:** purpose text or purpose hash only, not a separate need score.
- **Fee model:** tiered time-based fee with a maximum cap.
- **Privacy MVP:** Eligibility Attestation for selective reputation disclosure.
- **ZK verifier:** stretch only; do not pitch as committed unless implemented and tested.

## Remaining Implementation Decisions

- Who issues the Eligibility Attestation for the testnet flow: a local indexer script or a dedicated reputation agent?
- Which exact OpenClaw/Hermes wallet setup will be used for testnet signing?
- Which landing-page stats will be direct contract reads versus indexed testnet event summaries?
