import { SampleCard, SampleLabel } from '../Sample'

const groups: { title: string; tokens: string[] }[] = [
  {
    title: 'Surfaces',
    tokens: ['background', 'card', 'popover', 'sidebar', 'muted', 'secondary', 'accent'],
  },
  {
    title: 'Text and lines',
    tokens: ['foreground', 'muted-foreground', 'border', 'input', 'ring'],
  },
  {
    title: 'Actions and status',
    tokens: ['primary', 'success', 'success-strong', 'warning', 'warning-strong', 'destructive'],
  },
  {
    title: 'Chart, yellow in order',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
]

export function TokensCard() {
  return (
    <SampleCard
      title="Color tokens"
      description="Night Owl surfaces and blue, and a yellow chart ramp."
      className="flex flex-col gap-4"
    >
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h4 className="text-muted-foreground">{group.title}</h4>
          <div className="grid grid-cols-5 gap-2">
            {group.tokens.map((token) => (
              <div key={token} className="flex min-w-0 flex-col gap-1">
                <div
                  className="aspect-square rounded-md ring-1 ring-foreground/15"
                  style={{ backgroundColor: `var(--${token})` }}
                />
                <SampleLabel className="truncate">{token}</SampleLabel>
              </div>
            ))}
          </div>
        </section>
      ))}
    </SampleCard>
  )
}
