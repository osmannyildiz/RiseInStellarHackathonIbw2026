export const section =
  'border-b border-border py-14 px-[clamp(20px,5vw,72px)] max-[940px]:py-9'

export const sectionHeading =
  'mb-7 grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]'

export const splitSection =
  `${section} grid items-start gap-10 max-[940px]:grid-cols-1 min-[941px]:grid-cols-[minmax(220px,0.38fr)_minmax(0,0.62fr)]`

export const heading2 =
  'm-0 text-text-strong text-[clamp(28px,3vw,42px)] leading-[1.08] font-[620] tracking-normal'

export const heading3 = 'm-0 text-base font-semibold text-text-strong'

export const bodyText = 'm-0 leading-relaxed text-text'

const buttonBase =
  'inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 text-sm font-medium no-underline transition duration-150 hover:-translate-y-px hover:border-text-muted focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent'

export const button = `${buttonBase} border-border-strong bg-surface text-text-strong`

export const buttonPrimary =
  `${buttonBase} border-gray-900 bg-gray-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-gray-900`

export const buttonSecondary =
  `${buttonBase} border-border-strong bg-transparent text-text-strong`

export const inlineCode =
  'block overflow-x-auto rounded-md bg-code-bg p-3 font-mono text-[13px] leading-normal whitespace-nowrap text-text-strong'

export const panelLabel =
  'mb-2 block text-xs font-medium uppercase text-text-muted'

export const panelValue =
  'block break-anywhere text-[17px] leading-snug text-text-strong'
