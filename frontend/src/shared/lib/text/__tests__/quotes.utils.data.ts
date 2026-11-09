const text = 'I ask seniors in my club.\nI never know who is free this week, or who is free.'

/** A text, a quote, and where the quote sits in it. */
export const quoteCases = [
  {
    name: 'words that are in the text exactly',
    text,
    quote: 'I ask seniors in my club',
    expected: { start: 0, end: 24 },
  },
  {
    name: 'words in another case',
    text,
    quote: 'i NEVER know',
    expected: { start: 26, end: 38 },
  },
  {
    name: 'words that the text breaks across a line',
    text,
    quote: 'club. I never',
    expected: { start: 20, end: 33 },
  },
  {
    name: 'the first place, when the words come twice',
    text,
    quote: 'who is free',
    expected: { start: 39, end: 50 },
  },
  {
    name: 'words with signs that a pattern reads as its own',
    text: 'Pay (2 x $5) now?',
    quote: '(2 x $5) now?',
    expected: { start: 4, end: 17 },
  },
  { name: 'words that are not in the text', text, quote: 'I never sleep', expected: null },
  { name: 'a blank quote', text, quote: '  ', expected: null },
]

import type { TextRange } from '../text.types'

const longText =
  'A mentor sets the weekly hours when sessions can be booked, and a student sees those free hours while searching for a mentor in the field of study.'

// Where a quote sits in the long text, cut to at most 60 characters.
const middle = longText.indexOf('free hours')
const first = longText.indexOf('A mentor')
const last = longText.indexOf('field of study')

/** Where the cut falls: after the quote only, around it, or before it only. */
type CutSide = 'start' | 'middle' | 'end'

interface CutCase {
  name: string
  text: string
  range: TextRange
  maxLength: number
  expectedFrom: CutSide
}

export const wholeExcerptCase = {
  text: 'It lasts one hour.',
  range: { start: 9, end: 17 },
  maxLength: 60,
}

export const cutExcerptCases: CutCase[] = [
  {
    name: 'a quote at the start, cut after it only',
    text: longText,
    range: { start: first, end: first + 'A mentor sets'.length },
    maxLength: 60,
    expectedFrom: 'start',
  },
  {
    name: 'a quote in the middle, cut at both ends',
    text: longText,
    range: { start: middle, end: middle + 'free hours'.length },
    maxLength: 60,
    expectedFrom: 'middle',
  },
  {
    name: 'a quote at the end, cut before it only',
    text: longText,
    range: { start: last, end: longText.length - 1 },
    maxLength: 60,
    expectedFrom: 'end',
  },
]
