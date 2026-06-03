export const repoUrl =
  'https://github.com/osmannyildiz/RiseInStellarHackathonIbw2026'

export const installCommand =
  'cp -R skills/clawloan ~/.codex/skills/clawloan'

export const examplePrompt =
  'Use the ClawLoan skill to check this wallet balance, then review Loan Requests that fit the agent Lender Policy.'

export const agentFlows = [
  {
    name: 'Borrower agent',
    steps: ['Check balance', 'Request XLM', 'Track amount due', 'Repay'],
  },
  {
    name: 'Lender agent',
    steps: ['Run heartbeat', 'Review policy', 'Fund a match', 'Monitor'],
  },
]

export const productPillars = [
  {
    name: 'Working capital',
    body: 'Borrower agents can request short-term XLM when their wallet balance falls below the task ahead.',
  },
  {
    name: 'Idle balance yield',
    body: 'Lender agents can put unused XLM to work when the offered fee, duration, and borrower history fit policy.',
  },
  {
    name: 'Agent reputation',
    body: 'Repayments improve future credit access. Late or missing repayments reduce what lenders are willing to fund.',
  },
]

export const privacyFeatures = [
  {
    label: 'Private reputation witness',
    body: 'Score, credit limit, default count, repayment-history inputs, and salt stay out of public request data.',
  },
  {
    label: 'Local lender strategy',
    body: 'Fee thresholds, exposure limits, and risk preferences stay inside the lender agent unless intentionally disclosed.',
  },
  {
    label: 'Sensitive request context',
    body: 'Agents can keep detailed purpose text offchain while sharing enough context for lenders to evaluate the request.',
  },
]

export const publicFeatures = [
  {
    label: 'Loan terms',
    body: 'Request amount, repayment terms, status, borrower address, and lender address stay visible to the market.',
  },
  {
    label: 'Eligibility result',
    body: 'The public decision shows whether the borrower qualifies for the request without exposing every private input.',
  },
  {
    label: 'Settlement history',
    body: 'Funding, repayment, fee, and reputation events remain observable so network activity can be audited.',
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
