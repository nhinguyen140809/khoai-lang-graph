import type { ContentValues } from '../content-values.types'
import type { QuotePlace } from '../quote-place.types'

interface QuotePlaceCase {
  name: string
  /** The kind whose schema places the quote; none for an item whose kind has no schema yet. */
  kind: 'interview_message' | 'analyzed_requirement' | null
  content: ContentValues
  quote: string
  expected: QuotePlace
}

const message = 'I never know who is free this week, so I give up.'
const requirement: ContentValues = {
  title: 'Search within 2 seconds',
  statement: 'A search result is listed within 2 seconds.',
  type: 'non_functional',
  quality_category: 'performance',
  priority: 'should',
  rationale: 'Students leave a slow page.',
}

export const quotePlaceCases: QuotePlaceCase[] = [
  {
    name: 'an item that is named by its own words, in its title',
    kind: 'interview_message',
    content: { turn: 2, speaker: 'PER-001', content: message },
    quote: 'who is free this week',
    expected: { type: 'title', range: { start: 13, end: 34 } },
  },
  {
    name: 'words that only the statement holds, in the statement',
    kind: 'analyzed_requirement',
    content: requirement,
    quote: 'result is listed',
    expected: {
      type: 'field',
      field: 'statement',
      text: 'A search result is listed within 2 seconds.',
      range: { start: 9, end: 25 },
    },
  },
  {
    name: 'words that the title and the statement both hold, in the statement first',
    kind: 'analyzed_requirement',
    content: requirement,
    quote: 'within 2 seconds',
    expected: {
      type: 'field',
      field: 'statement',
      text: 'A search result is listed within 2 seconds.',
      range: { start: 26, end: 42 },
    },
  },
  {
    name: 'words that only the title holds, in the title',
    kind: 'analyzed_requirement',
    content: { ...requirement, statement: 'A search result is listed fast.' },
    quote: 'Search within',
    expected: { type: 'title', range: { start: 0, end: 13 } },
  },
  {
    name: 'words of another text field, in that field',
    kind: 'analyzed_requirement',
    content: requirement,
    quote: 'leave a slow page',
    expected: {
      type: 'field',
      field: 'rationale',
      text: 'Students leave a slow page.',
      range: { start: 9, end: 26 },
    },
  },
  {
    name: 'words in another case and with other spacing, where the words are',
    kind: 'interview_message',
    content: { turn: 2, speaker: 'PER-001', content: message },
    quote: 'I  NEVER know',
    expected: { type: 'title', range: { start: 0, end: 12 } },
  },
  {
    name: 'words that no field holds, as the quote itself',
    kind: 'analyzed_requirement',
    content: requirement,
    quote: 'a couple of seconds',
    expected: { type: 'quote' },
  },
  {
    name: 'an item of a kind without a schema, as the quote itself',
    kind: null,
    content: requirement,
    quote: 'within 2 seconds',
    expected: { type: 'quote' },
  },
]
