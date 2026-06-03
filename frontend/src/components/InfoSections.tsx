import {
  docsLinks,
  privacyFeatures,
  productPillars,
  publicFeatures,
  repoUrl,
} from '../content'
import { bodyText, heading2, heading3, section } from '../styles'
import {
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiGitBranch,
  FiLock,
  FiShield,
  FiTrendingUp,
  FiUnlock,
  FiUserCheck,
} from 'react-icons/fi'
import type { IconType } from 'react-icons'

type InfoSectionsProps = {
  contractHref?: string
}

const docLink =
  'inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-strong no-underline hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent max-[560px]:w-full max-[560px]:box-border'

const iconBox =
  'mb-4 inline-grid size-9 place-items-center rounded-md border border-border bg-bg text-accent'

const productIcons: Record<string, IconType> = {
  'Working capital': FiDollarSign,
  'Idle balance yield': FiTrendingUp,
  'Agent reputation': FiUserCheck,
}

const privateIcons: Record<string, IconType> = {
  'Private reputation witness': FiLock,
  'Local lender strategy': FiShield,
  'Sensitive request context': FiFileText,
}

const publicIcons: Record<string, IconType> = {
  'Loan terms': FiGitBranch,
  'Eligibility result': FiCheckCircle,
  'Settlement history': FiActivity,
}

const docsIcons: Record<string, IconType> = {
  Skill: FiUnlock,
  Project: FiFileText,
  Data: FiActivity,
  Privacy: FiShield,
}

export function InfoSections({ contractHref }: InfoSectionsProps) {
  return (
    <>
      <section
        className={`${section} grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]`}
      >
        <div>
          <div className={iconBox}>
            <FiClock aria-hidden="true" />
          </div>
          <h2 className={heading2}>Bounded Credit For Agents</h2>
        </div>
        <div className="max-w-[820px]">
          <p className={bodyText}>
            ClawLoan gives autonomous wallets access to small,
            reputation-gated credit lines. New agents start with conservative
            limits, successful repayment expands future access, and every
            lender agent decides whether a request fits its own risk policy.
          </p>
        </div>
      </section>

      <section
        className={`${section} grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]`}
      >
        <div>
          <div className={iconBox}>
            <FiEye aria-hidden="true" />
          </div>
          <h2 className={heading2}>Privacy Boundary</h2>
          <p className="mt-3 max-w-[360px] text-sm leading-relaxed text-text">
            ClawLoan separates private decision inputs from public settlement
            data, so lenders can verify eligibility while the market remains
            auditable.
          </p>
        </div>
        <div className="grid gap-3 max-[760px]:grid-cols-1 min-[761px]:grid-cols-2">
          <PrivacyColumn
            title="Kept private"
            items={privacyFeatures}
            icons={privateIcons}
          />
          <PrivacyColumn
            title="Kept public"
            items={publicFeatures}
            icons={publicIcons}
          />
        </div>
      </section>

      <section className={section}>
        <h2 className={heading2}>Agent-Native Lending</h2>
        <div className="mt-5 grid gap-3 max-[940px]:grid-cols-1 min-[941px]:grid-cols-3">
          {productPillars.map((pillar) => (
            <article
              className="rounded-lg border border-border bg-surface p-4"
              key={pillar.name}
            >
              <IconFor
                className={iconBox}
                icons={productIcons}
                label={pillar.name}
              />
              <h3 className={heading3}>{pillar.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${section} pb-[72px]`}>
        <h2 className={heading2}>Start With ClawLoan</h2>
        <p className={`${bodyText} mt-3 max-w-[720px]`}>
          Install the skill for agent workflows, inspect the contract when a
          deployment is available, or read the product and data references.
        </p>
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
              <IconFor
                className="mr-2 text-accent"
                icons={docsIcons}
                label={link.label}
              />
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </>
  )
}

type IconForProps = {
  className: string
  icons: Record<string, IconType>
  label: string
}

function IconFor({ className, icons, label }: IconForProps) {
  const Icon = icons[label]
  return Icon ? (
    <span aria-hidden="true" className={className}>
      <Icon />
    </span>
  ) : null
}

type PrivacyColumnProps = {
  title: string
  items: Array<{ label: string; body: string }>
  icons: Record<string, IconType>
}

function PrivacyColumn({ title, items, icons }: PrivacyColumnProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <h3 className={heading3}>{title}</h3>
      <ul className="m-0 mt-4 grid list-none gap-4 p-0">
        {items.map((item) => (
          <li className="grid grid-cols-[36px_minmax(0,1fr)] gap-3" key={item.label}>
            <IconFor
              className="mt-0.5 grid size-9 place-items-center rounded-md border border-border bg-bg p-2 text-accent"
              icons={icons}
              label={item.label}
            />
            <div>
              <span className="block text-sm font-medium leading-snug text-text-strong">
                {item.label}
              </span>
              <p className="m-0 mt-1 text-sm leading-relaxed text-text">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
