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

export const privacyMadePrivate = [
  {
    label: 'Private witness',
    body: 'Score, credit limit, default count, repayment-history inputs, and salt stay inside the proof witness.',
  },
  {
    label: 'Eligibility details',
    body: 'The borrower proves the policy checks without revealing the values behind the reputation root.',
  },
  {
    label: 'Purpose text',
    body: 'The narrative purpose stays offchain; the request only carries a purpose hash.',
  },
]

export const privacyKeptPublic = [
  {
    label: 'Proof output',
    body: 'Eligible for this request, request id, amount, policy threshold, reputation root, nullifier, and expiry.',
  },
  {
    label: 'Verifier result',
    body: 'The Groth16/BLS12-381 receipt records valid or invalid, and the contract stores the nullifier for replay protection.',
  },
  {
    label: 'Settlement',
    body: 'XLM transfers, borrower and lender addresses, public repayment events, and request amount remain public.',
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
