import type { NetworkStatsState } from '../data/networkStats'
import {
  bodyText,
  heading2,
  panelLabel,
  panelValue,
  section,
  sectionHeading,
} from '../styles'

type NetworkStatsPanelProps = {
  state: NetworkStatsState
}

const formatDuration = (seconds: number | null) => {
  if (seconds === null) {
    return 'Unavailable'
  }

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds === 0
    ? `${minutes}m`
    : `${minutes}m ${remainingSeconds}s`
}

export function NetworkStatsPanel({ state }: NetworkStatsPanelProps) {
  const stats =
    state.status === 'ready'
      ? [
          ['Open Loan Requests', String(state.snapshot.stats.openLoanRequests)],
          [
            'Loan Requests Posted',
            String(state.snapshot.stats.loanRequestsPosted),
          ],
          ['Loans Funded', String(state.snapshot.stats.loansFunded)],
          ['Loans Repaid', String(state.snapshot.stats.loansRepaid)],
          ['Total XLM Lent', state.snapshot.stats.totalXlmLent],
          ['Total Fees Paid', state.snapshot.stats.totalFeesPaid],
          [
            'Average Repayment Time',
            formatDuration(state.snapshot.stats.averageRepaymentTimeSeconds),
          ],
        ]
      : [
          ['Open Loan Requests', 'Unavailable'],
          ['Loan Requests Posted', 'Unavailable'],
          ['Loans Funded', 'Unavailable'],
          ['Loans Repaid', 'Unavailable'],
          ['Total XLM Lent', 'Unavailable'],
          ['Total Fees Paid', 'Unavailable'],
          ['Average Repayment Time', 'Unavailable'],
        ]

  return (
    <section id="network" className={section}>
      <div className={sectionHeading}>
        <h2 className={heading2}>Network Stats</h2>
        <p className={bodyText}>
          A public view of open demand, funded capital, repayment activity, and
          lender fees from the ClawLoan network.
        </p>
      </div>

      <div className="grid gap-3 max-[940px]:grid-cols-1 min-[941px]:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            className="min-h-[116px] rounded-lg border border-border bg-surface p-4"
            key={label}
          >
            <span className={panelLabel}>{label}</span>
            <strong className={panelValue}>{value}</strong>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3.5 max-[940px]:grid">
        {state.status === 'ready' ? (
          <>
            <p className="m-0 text-sm text-text">
              Source: {state.snapshot.source}. Updated{' '}
              {new Date(state.snapshot.generatedAt).toLocaleString()}.
            </p>
            <code className="block max-w-[min(520px,50%)] overflow-x-auto rounded-md bg-code-bg p-3 font-mono text-[13px] leading-normal whitespace-nowrap text-text-strong max-[940px]:max-w-full">
              {state.snapshot.contractId}
            </code>
          </>
        ) : (
          <p className="m-0 text-sm text-text">{state.reason}</p>
        )}
      </div>
    </section>
  )
}
