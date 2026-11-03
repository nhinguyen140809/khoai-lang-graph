'use client'

import { useState } from 'react'

import { Badge } from '@/shared/components/ui/badge'
import { Code } from '@/shared/components/ui/code'
import { Highlight, HighlightMark, type HighlightVariant } from '@/shared/components/ui/highlight'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { rangesOfQuery } from '@/shared/lib/text'
import { tones } from '@/shared/lib/tone'

import {
  interviewMessage,
  type QuotedItem,
  quotedItems,
  searchText,
} from '../../design-system.fixtures'
import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

const highlightVariants = [
  'underline',
  'wavy',
  'soft',
  'solid',
] as const satisfies readonly HighlightVariant[]

// The words of each quoted item, as a range that carries the item for the popup.
const quoteRanges = quotedItems.flatMap((item) =>
  rangesOfQuery(interviewMessage, item.quote, { matchAll: false }).map((range) => ({
    ...range,
    color: item.color,
    item,
  })),
)

function QuotePopup({ item }: { item: QuotedItem }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="soft" color={item.color}>
          {item.key}
        </Badge>
        <span className="font-semibold">{item.title}</span>
      </div>
      <SampleLabel>evidenced_by</SampleLabel>
      <blockquote className="border-l-2 pl-2 text-xs text-muted-foreground italic">
        {item.quote}
      </blockquote>
    </div>
  )
}

export function HighlightCard() {
  const [query, setQuery] = useState('mentor')

  return (
    <SampleCard
      title="Highlight"
      description={
        <>
          <Code>variant</Code> is how the words are marked, <Code>color</Code> the meaning. Hover a
          line mark to see its fill.
        </>
      }
      className="flex flex-col gap-4"
    >
      {highlightVariants.map((variant) => (
        <SampleGroup key={variant} label={variant}>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {tones.map((color) => (
              <HighlightMark key={color} variant={variant} color={color}>
                {color}
              </HighlightMark>
            ))}
          </p>
        </SampleGroup>
      ))}
      <SampleGroup label="query">
        <Input
          aria-label="Words to mark"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
        />
        <p className="text-sm">
          <Highlight query={query} variant="soft" color="warning">
            {searchText}
          </Highlight>
        </p>
      </SampleGroup>
      <SampleGroup label="ranges, one color for each item, with a popup on click">
        <p className="text-sm leading-relaxed">
          <Highlight
            ranges={quoteRanges}
            renderMark={(mark, { item }) => (
              <Popover>
                <PopoverTrigger asChild>{mark}</PopoverTrigger>
                <PopoverContent>
                  <QuotePopup item={item} />
                </PopoverContent>
              </Popover>
            )}
          >
            {interviewMessage}
          </Highlight>
        </p>
      </SampleGroup>
    </SampleCard>
  )
}
