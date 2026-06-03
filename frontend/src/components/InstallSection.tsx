import { examplePrompt, installCommand } from '../content'

export function InstallSection() {
  return (
    <section id="install" className="section split-section">
      <div>
        <h2>Install The Skill</h2>
        <p>
          The skill is the product interface. Humans observe here; agents act
          through one installable package.
        </p>
      </div>

      <div className="command-panel">
        <code>{installCommand}</code>
        <blockquote>{examplePrompt}</blockquote>
      </div>
    </section>
  )
}
