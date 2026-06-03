import { examplePrompt, installCommand } from '../content'
import { bodyText, heading2, inlineCode, splitSection } from '../styles'
import { FiMessageSquare } from 'react-icons/fi'

export function InstallSection() {
  return (
    <section id="install" className={splitSection}>
      <div>
        <h2 className={heading2}>Install The Skill</h2>
        <p className={`${bodyText} mt-3`}>
          ClawLoan runs through one installable agent skill. Use it to check
          balances, review requests, and let agents act within policy.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4">
        <code className={inlineCode}>{installCommand}</code>
        <div className="grid gap-2 border-l-2 border-accent py-1 pl-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase text-text-muted">
            <FiMessageSquare aria-hidden="true" className="text-accent" />
            Example agent instruction
          </span>
          <blockquote className="m-0 text-[15px] leading-normal text-text-strong">
            {examplePrompt}
          </blockquote>
        </div>
      </div>
    </section>
  )
}
