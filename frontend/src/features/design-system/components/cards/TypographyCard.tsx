import { Code } from '@/components/ui/code'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'

import { SampleCard, SampleLabel } from '../Sample'

const headings = [
  { Tag: 'h1', size: 'text-lg' },
  { Tag: 'h2', size: 'text-base' },
  { Tag: 'h3', size: 'text-sm' },
  { Tag: 'h4', size: 'text-xs' },
  { Tag: 'h5', size: 'text-xs' },
  { Tag: 'h6', size: 'text-xs' },
] as const

export function TypographyCard() {
  return (
    <SampleCard
      title="Typography"
      description="Segoe UI for the interface, Consolas for code."
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        {headings.map(({ Tag, size }) => (
          <div key={Tag} className="flex items-baseline justify-between gap-3">
            <Tag>Requirement specification</Tag>
            <SampleLabel className="shrink-0">
              {Tag} {size}
            </SampleLabel>
          </div>
        ))}
      </div>
      <Separator />
      <p className="text-sm">
        Body, text-sm: the system shall let a student search mentors by field and availability.
      </p>
      <p className="text-xs/relaxed">
        Component text, text-xs: buttons, inputs, menus, and table cells use this size.
      </p>
      <p className="text-xs text-muted-foreground">
        Muted text for descriptions, hints, and timestamps.
      </p>
      <p className="text-xs">
        Inline code <Code>REQ-001</Code> and keys{' '}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </p>
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {`> I want an online platform for students to find mentors.
* planner             Elicitation plan v1      0:21
* persona_generator   PER-001 PER-002 PER-003  0:35`}
      </pre>
    </SampleCard>
  )
}
