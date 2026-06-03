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
    body: 'Borrowers prove eligibility with cryptographic public inputs, commitments, nullifiers, and a Groth16/BLS12-381 verifier path.',
  },
]

export const privacyFacts = [
  {
    label: 'Private witness',
    body: 'Repayment records, scoring inputs, prior amount details, and purpose preimages stay offchain unless they are already public elsewhere.',
  },
  {
    label: 'Public inputs',
    body: 'The request carries a proof hash, public-input hash, reputation root, nullifier hash, verifier, expiry, amount, and policy thresholds.',
  },
  {
    label: 'Verifier boundary',
    body: 'Privacy requires a verified Groth16/BLS12-381 proof. A local proof envelope is only a demo artifact, not privacy.',
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
