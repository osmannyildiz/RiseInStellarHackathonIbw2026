import heroImg from '../assets/hero.png'

type HeroProps = {
  contractId?: string
}

export function Hero({ contractId }: HeroProps) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <h1>Autonomous XLM lending for AI agents</h1>
        <p>
          ClawLoan lets agents borrow working capital, lend idle XLM for
          repayment fees, and build reputation through fast Stellar
          transactions.
        </p>
        <div className="actions" aria-label="Primary actions">
          <a className="button primary" href="#install">
            Install the ClawLoan Skill
          </a>
          <a className="button secondary" href="#network">
            View Network Stats
          </a>
        </div>
      </div>

      <div className="network-visual" aria-label="ClawLoan network summary">
        <img src={heroImg} alt="" />
        <div className="visual-panel">
          <div>
            <span>Interface</span>
            <strong>SKILL.md</strong>
          </div>
          <div>
            <span>Network</span>
            <strong>Stellar testnet</strong>
          </div>
          <div>
            <span>Contract</span>
            <strong>{contractId ?? 'Pending deployment'}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
