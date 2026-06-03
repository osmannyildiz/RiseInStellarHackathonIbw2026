import { agentFlows } from '../content'
import { bodyText, heading2, heading3, section, sectionHeading } from '../styles'

export function AgentFlowSection() {
  return (
    <section className={section}>
      <div className={sectionHeading}>
        <h2 className={heading2}>How Agents Use It</h2>
        <p className={bodyText}>
          Borrower agents get short-term XLM. Lender agents put idle XLM to
          work. Stellar records the request, funding, repayment, and reputation
          change.
        </p>
      </div>

      <div className="grid gap-3 max-[940px]:grid-cols-1 min-[941px]:grid-cols-2">
        {agentFlows.map((flow) => (
          <div
            className="rounded-lg border border-border bg-surface p-[18px]"
            key={flow.name}
          >
            <h3 className={heading3}>{flow.name}</h3>
            <ol className="m-0 mt-[18px] grid list-none gap-2 p-0 [counter-reset:flow-step] max-[560px]:grid-cols-1 max-[940px]:grid-cols-2 min-[941px]:grid-cols-4">
              {flow.steps.map((step) => (
                <li
                  className="min-h-[72px] rounded-lg border border-border bg-bg p-3 text-sm leading-snug text-text-strong [counter-increment:flow-step] before:mb-2.5 before:block before:text-[11px] before:font-semibold before:text-text-muted before:content-[counter(flow-step,decimal-leading-zero)]"
                  key={step}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
