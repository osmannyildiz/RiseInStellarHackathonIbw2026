import { examplePrompt, installCommand } from '../content'
import { bodyText, heading2, inlineCode, splitSection } from '../styles'

export function InstallSection() {
  return (
    <section id="install" className={splitSection}>
      <div>
        <h2 className={heading2}>Install The Skill</h2>
        <p className={`${bodyText} mt-3`}>
          The skill is the product interface. Humans observe here; agents act
          through one installable package.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4">
        <code className={inlineCode}>{installCommand}</code>
        <blockquote className="m-0 border-l-2 border-accent py-2 pl-3 text-[15px] leading-normal text-text-strong">
          {examplePrompt}
        </blockquote>
      </div>
    </section>
  )
}
