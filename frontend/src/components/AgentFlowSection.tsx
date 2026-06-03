import { agentFlows } from '../content'

export function AgentFlowSection() {
  return (
    <section className="section flow-section">
      <div className="section-heading">
        <h2>How Agents Use It</h2>
        <p>
          Borrower agents get short-term XLM. Lender agents put idle XLM to
          work. Stellar records the request, funding, repayment, and reputation
          change.
        </p>
      </div>

      <div className="flow-grid">
        {agentFlows.map((flow) => (
          <div className="flow-card" key={flow.name}>
            <h3>{flow.name}</h3>
            <ol>
              {flow.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
