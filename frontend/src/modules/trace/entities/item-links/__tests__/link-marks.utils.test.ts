import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields, mainField } from '@/modules/workflow/entities'

import type { LinkQuote, TraceItem } from '../../chains/chains.types'
import { fieldMarksOf, markRangesOf } from '../link-marks.utils'

const requirementKind = 'spec_requirement'
const requirementItem = { id: 'other', kind: requirementKind } as TraceItem

/** A quote of the given words, from a link of the given side to the item given. */
function quoteOf(words: string, other: TraceItem, side: LinkQuote['side'] = 'source'): LinkQuote {
  return {
    link: {
      id: `link-${words}`,
      source_item_id: 'item',
      target_item_id: other.id,
      link_type: 'concerns',
      target_version: 1,
      target_quote: null,
      source_quote: null,
      note: null,
    },
    side,
    quote: words,
    other,
  }
}

const schema = contentSchemaFixtureByKind(requirementKind)
const main = mainField(schema)
const fields = main === undefined ? [] : [main, ...contentFields(schema).filter((f) => f !== main)]

describe('fieldMarksOf', () => {
  it('places a quote in the field that holds its words, underlined in primary', () => {
    const marks = fieldMarksOf(
      { statement: 'The system shall let a student search mentors by field of study.' },
      [quoteOf('search mentors by field of study', requirementItem)],
      { fields },
    )

    expect(marks.get('statement')).toEqual([
      {
        id: 'link-search mentors by field of study',
        linkIds: ['link-search mentors by field of study'],
        start: 31,
        end: 63,
        variant: 'underline',
        color: 'primary',
        strokeWidth: 3,
      },
    ])
  })

  it('marks the words that another record quotes in the yellow of the charts', () => {
    const marks = fieldMarksOf(
      { statement: 'A search result is listed within 2 seconds.' },
      [quoteOf('within 2 seconds', requirementItem, 'target')],
      { fields },
    )

    expect(marks.get('statement')?.[0]?.color).toBe('chart')
  })

  it('merges overlapping quotes of one field into one mark with both links', () => {
    const marks = fieldMarksOf(
      { statement: 'The system shall let a student search mentors.' },
      [
        quoteOf('let a student', requirementItem),
        quoteOf('student search mentors', requirementItem),
      ],
      { fields },
    )

    expect(marks.get('statement')).toEqual([
      {
        id: 'link-student search mentors',
        linkIds: ['link-student search mentors', 'link-let a student'],
        start: 17,
        end: 45,
        variant: 'underline',
        color: 'primary',
        strokeWidth: 3,
      },
    ])
  })

  it('keeps the yellow when quotes of both directions merge', () => {
    const marks = fieldMarksOf(
      { statement: 'The system shall let a student search mentors.' },
      [
        quoteOf('let a student', requirementItem),
        quoteOf('student search mentors', requirementItem, 'target'),
      ],
      { fields },
    )

    expect(marks.get('statement')?.[0]?.color).toBe('chart')
  })

  it('leaves a quote out that no field holds', () => {
    const marks = fieldMarksOf(
      { statement: 'The system shall list mentors.' },
      [quoteOf('words that are not there', requirementItem)],
      { fields },
    )

    expect(marks.size).toBe(0)
  })
})

describe('markRangesOf', () => {
  it('places the quotes of one text, such as a message', () => {
    const marks = markRangesOf('I ask seniors in my club, but I never know who is free this week', [
      quoteOf('I ask seniors in my club', requirementItem),
      quoteOf('who is free this week', requirementItem),
    ])

    expect(marks.map(({ start, end }) => [start, end])).toEqual([
      [0, 24],
      [43, 64],
    ])
  })
})
