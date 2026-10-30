'use client'

import { Code } from '@/shared/components/ui/code'
import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { KeyText } from '@/shared/components/ui/key-text'
import { RelativeTime } from '@/shared/components/ui/relative-time'
import { Separator } from '@/shared/components/ui/separator'

import { SampleCard, SampleLabel } from '../Sample'

/** A moment this many minutes before now, for the words of a relative time. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

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
      description="Mona Sans for the interface, Noto Sans Mono for code."
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
      <p className="text-sm">
        Component text, text-sm: buttons, inputs, menus, and table cells use this size.
      </p>
      <p className="text-sm text-muted-foreground">Muted text for descriptions.</p>
      <p className="text-xs text-muted-foreground">
        Label, text-xs: the title of a group in a side panel, a caption, a hint.
      </p>
      <p className="font-mono text-3xs text-muted-foreground">
        Indicator, text-3xs: 12 items, REQ-001, 08:10
      </p>
      <p className="text-4xs text-muted-foreground">Badge, text-4xs: the count inside a badge.</p>
      <p className="text-xs">
        Inline code <Code>REQ-001</Code> and keys{' '}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </p>
      <p className="text-sm">
        The key of a record after its title, Requirement specification <KeyText>REQ-001</KeyText>,
        and a long key cut to fit,{' '}
        <KeyText truncate className="inline-block max-w-24 align-bottom">
          5f2d0000-0000-4000-8000-000000000001
        </KeyText>
        , with the whole key on hover.
      </p>
      <p className="text-sm">
        A moment as the words that people read, <RelativeTime date={minutesAgo(5)} />, with the
        exact time on hover, and one that holds still, <RelativeTime date={minutesAgo(90)} />.
      </p>
      <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
        {`> I want an online platform for students to find mentors.
* planner             Elicitation plan v1      0:21
* persona_generator   PER-001 PER-002 PER-003  0:35`}
      </pre>
    </SampleCard>
  )
}
