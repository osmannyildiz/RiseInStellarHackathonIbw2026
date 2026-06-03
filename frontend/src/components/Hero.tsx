import heroImg from '../assets/hero.png'
import {
  buttonPrimary,
  buttonSecondary,
  panelLabel,
  panelValue,
} from '../styles'
import { FiBarChart2, FiDownload } from 'react-icons/fi'

type HeroProps = {
  contractId?: string
}

export function Hero({ contractId }: HeroProps) {
  return (
    <section className="grid min-h-[88svh] items-center border-b border-border max-[940px]:min-h-0 min-[941px]:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <div className="px-[clamp(20px,5vw,72px)] py-[72px] max-[940px]:pt-14 max-[940px]:pb-12">
        <h1 className="m-0 max-w-[840px] text-text-strong text-[clamp(42px,6vw,82px)] leading-[0.98] font-[620] tracking-normal">
          Autonomous XLM lending for AI agents
        </h1>
        <p className="m-0 mt-[22px] max-w-[660px] text-xl leading-[1.58]">
          ClawLoan lets agents borrow working capital, lend idle XLM for
          repayment fees, and build reputation through fast Stellar
          transactions.
        </p>
        <div
          className="mt-8 flex flex-wrap gap-2.5 max-[560px]:flex-col"
          aria-label="Primary actions"
        >
          <a className={buttonPrimary} href="#install">
            <FiDownload aria-hidden="true" className="mr-2" />
            Install the ClawLoan Skill
          </a>
          <a className={buttonSecondary} href="#network">
            <FiBarChart2 aria-hidden="true" className="mr-2 text-accent" />
            View Network Stats
          </a>
        </div>
      </div>

      <div
        className="relative grid min-h-full place-items-center overflow-hidden border-border bg-surface-subtle bg-size-[32px_32px] max-[940px]:min-h-[260px] max-[940px]:border-t min-[941px]:border-l"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent 31px, var(--color-grid-line) 32px), linear-gradient(0deg, transparent 31px, var(--color-grid-line) 32px)`,
        }}
        aria-label="ClawLoan network summary"
      >
        <img
          src={heroImg}
          alt=""
          className="w-[min(46vw,320px)] -translate-y-9 opacity-90 max-[940px]:w-[min(64vw,260px)] max-[940px]:-translate-y-7"
        />
        <div className="absolute right-10 bottom-10 grid w-[min(340px,calc(100%-48px))] rounded-lg border border-border bg-bg/92 shadow-panel backdrop-blur-2xl max-[560px]:right-6 max-[560px]:bottom-6">
          <div className="p-4">
            <span className={panelLabel}>Interface</span>
            <strong className={panelValue}>SKILL.md</strong>
          </div>
          <div className="border-t border-border p-4">
            <span className={panelLabel}>Network</span>
            <strong className={panelValue}>Stellar testnet</strong>
          </div>
          <div className="border-t border-border p-4">
            <span className={panelLabel}>Contract</span>
            <strong className={panelValue}>
              {contractId ?? 'Pending deployment'}
            </strong>
          </div>
        </div>
      </div>
    </section>
  )
}
