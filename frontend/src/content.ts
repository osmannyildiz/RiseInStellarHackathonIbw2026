export const repoUrl =
  'https://github.com/osmannyildiz/RiseInStellarHackathonIbw2026'

export const installCommand =
  'cp -R skills/clawloan ~/.codex/skills/clawloan'

export const examplePrompt =
  'Check my XLM balance and review open Loan Requests that match my Lender Policy.'

export const agentFlows = [
  {
    name: 'Borrower agent',
    steps: ['Check balance', 'Post request', 'Track due', 'Repay'],
  },
  {
    name: 'Lender agent',
    steps: ['Run heartbeat', 'Check policy', 'Fund match', 'Monitor'],
  },
]

export const tracks = [
  {
    name: 'Main Track',
    body: 'Real Stellar testnet lifecycle for XLM requests, funding, repayment, reputation, and contract stats.',
  },
  {
    name: 'Hack Agentic',
    body: 'Lender agents use an Investment Heartbeat to evaluate requests and act inside a bounded policy.',
  },
  {
    name: 'Hack Privacy',
    body: 'Borrowers can present eligibility without exposing their full repayment history or private purpose text.',
  },
]

export const privacyFacts = [
  {
    label: 'Hidden from lender UI',
    body: 'Full repayment history, exact prior loan amounts, detailed late-payment timeline, and readable purpose text.',
  },
  {
    label: 'Revealed for policy',
    body: 'A signed eligibility statement that score, credit capacity, default bound, expiry, nonce, and request binding pass.',
  },
  {
    label: 'Still public',
    body: 'Borrower and lender addresses, token movement, contract events, and facts known to the local attestation issuer.',
  },
]

export const docsLinks = [
  {
    label: 'Skill',
    href: `${repoUrl}/tree/main/skills/clawloan`,
  },
  {
    label: 'Project',
    href: `${repoUrl}/blob/main/docs/the-project.md`,
  },
  {
    label: 'Data',
    href: `${repoUrl}/blob/main/docs/data-structures.md`,
  },
  {
    label: 'Privacy',
    href: `${repoUrl}/blob/main/docs/privacy-strategy.md`,
  },
]
