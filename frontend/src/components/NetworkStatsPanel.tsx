import type { NetworkStatsState } from '../data/networkStats'
import { readMethods } from '../data/networkStats'

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
    <section id="network" className="section network-section">
      <div className="section-heading">
        <h2>Network Stats</h2>
        <p>
          Direct contract reads are the source of truth. Event charts stay
          hidden until a real testnet index exists.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="source-row">
        {state.status === 'ready' ? (
          <>
            <p>
              Source: {state.snapshot.source}. Updated{' '}
              {new Date(state.snapshot.generatedAt).toLocaleString()}.
            </p>
            <code>{state.snapshot.contractId}</code>
          </>
        ) : (
          <>
            <p>{state.reason}</p>
            <code>Expected: {readMethods.join(', ')}</code>
          </>
        )}
      </div>
    </section>
  )
}
