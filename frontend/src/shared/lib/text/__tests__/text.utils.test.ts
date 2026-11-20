import { describe, expect, it } from 'vitest'

import {
  articleOf,
  collapseSpaces,
  firstLineOf,
  foldText,
  hasTextPart,
  joinPresent,
  textOf,
} from '../text.utils'
import {
  firstLineCases,
  foldTextCases,
  includesTextCases,
  joinPresentCases,
  textOfCases,
} from './text.utils.data'

describe('foldText', () => {
  it.each(foldTextCases)('reads $name', ({ text, folded }) => {
    expect(foldText(text)).toBe(folded)
  })
})

describe('hasTextPart', () => {
  it.each(includesTextCases)('finds $name', ({ text, part, found }) => {
    expect(hasTextPart(text, part)).toBe(found)
  })
})

describe('textOf', () => {
  it.each(textOfCases)('reads $name', ({ value, text }) => {
    expect(textOf(value)).toBe(text)
  })
})

describe('firstLineOf', () => {
  it.each(firstLineCases)('reads $name', ({ text, line }) => {
    expect(firstLineOf(text)).toBe(line)
  })
})

describe('joinPresent', () => {
  it.each(joinPresentCases)('$name', ({ parts, separator, joined }) => {
    expect(joinPresent(parts, separator)).toBe(joined)
  })
})

describe('articleOf', () => {
  it.each([
    { word: 'Based on', article: 'a' },
    { word: 'Applies to', article: 'an' },
    { word: 'Involves', article: 'an' },
  ])('reads the article of $word', ({ word, article }) => {
    expect(articleOf(word)).toBe(article)
  })
})

describe('collapseSpaces', () => {
  it('trims the text and makes every run of spaces, tabs and line breaks one space', () => {
    expect(collapseSpaces('  Commuter \t students\n at   night ')).toBe(
      'Commuter students at night',
    )
  })

  it('leaves a text with no extra space as it is, and a blank text empty', () => {
    expect(collapseSpaces('Staff')).toBe('Staff')
    expect(collapseSpaces(' \n ')).toBe('')
  })
})
