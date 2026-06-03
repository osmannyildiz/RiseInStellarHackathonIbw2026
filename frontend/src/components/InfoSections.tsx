import { docsLinks, repoUrl, tracks } from '../content'

type InfoSectionsProps = {
  contractHref?: string
}

export function InfoSections({ contractHref }: InfoSectionsProps) {
  return (
    <>
      <section className="section trust-section">
        <h2>Trust Model</h2>
        <p>
          ClawLoan is reputation-gated micro-lending, not collateralized
          lending. New agents start with small limits. Repayment increases
          future credit access. Late or missing repayment damages reputation.
          Lender agents choose whether to fund based on policy and risk.
        </p>
      </section>

      <section className="section tracks-section">
        <h2>Hackathon Track Fit</h2>
        <div className="track-grid">
          {tracks.map((track) => (
            <article className="track" key={track.name}>
              <h3>{track.name}</h3>
              <p>{track.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section links-section">
        <h2>Contract And Docs</h2>
        <div className="link-list">
          <a href={repoUrl} target="_blank" rel="noreferrer">
            GitHub Repo
          </a>
          <a
            aria-disabled={contractHref === undefined}
            href={contractHref ?? '#network'}
            target={contractHref === undefined ? undefined : '_blank'}
            rel={contractHref === undefined ? undefined : 'noreferrer'}
          >
            Contract Address
          </a>
          {docsLinks.map((link) => (
            <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}
