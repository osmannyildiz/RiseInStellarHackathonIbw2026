import { docsLinks, privacyFacts, repoUrl, tracks } from '../content'
import { bodyText, heading2, heading3, section } from '../styles'

type InfoSectionsProps = {
  contractHref?: string
}

const docLink =
  'inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-strong no-underline hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent max-[560px]:w-full max-[560px]:box-border'

export function InfoSections({ contractHref }: InfoSectionsProps) {
  return (
    <>
      <section
        className={`${section} grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]`}
      >
        <h2 className={heading2}>Trust Model</h2>
        <p className={`${bodyText} max-w-[820px]`}>
          ClawLoan is reputation-gated micro-lending, not collateralized
          lending. New agents start with small limits. Repayment increases
          future credit access. Late or missing repayment damages reputation.
          Lender agents choose whether to fund based on policy and risk.
        </p>
      </section>

      <section
        className={`${section} grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]`}
      >
        <div>
          <h2 className={heading2}>Privacy MVP</h2>
          <p className="mt-3 max-w-[360px] text-sm leading-relaxed text-text">
            Selective reputation disclosure, not private settlement.
          </p>
        </div>
        <div className="grid gap-3">
          {privacyFacts.map((fact) => (
            <article
              className="rounded-lg border border-border bg-surface p-4"
              key={fact.label}
            >
              <h3 className={heading3}>{fact.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text">
                {fact.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={section}>
        <h2 className={heading2}>Hackathon Track Fit</h2>
        <div className="mt-0 grid gap-3 max-[940px]:grid-cols-1 min-[941px]:grid-cols-3">
          {tracks.map((track) => (
            <article
              className="rounded-lg border border-border bg-surface p-4"
              key={track.name}
            >
              <h3 className={heading3}>{track.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text">
                {track.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${section} pb-[72px]`}>
        <h2 className={heading2}>Contract And Docs</h2>
        <div className="mt-5 flex flex-wrap gap-2.5 max-[560px]:flex-col">
          <a className={docLink} href={repoUrl} target="_blank" rel="noreferrer">
            GitHub Repo
          </a>
          <a
            className={`${docLink} aria-disabled:text-text-muted`}
            aria-disabled={contractHref === undefined}
            href={contractHref ?? '#network'}
            target={contractHref === undefined ? undefined : '_blank'}
            rel={contractHref === undefined ? undefined : 'noreferrer'}
          >
            Contract Address
          </a>
          {docsLinks.map((link) => (
            <a
              className={docLink}
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}
