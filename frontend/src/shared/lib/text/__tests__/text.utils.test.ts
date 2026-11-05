import { describe, expect, it } from 'vitest'

import { articleOf, firstLineOf, foldText, hasTextPart, textOf } from '../text.utils'
import { firstLineCases, foldTextCases, includesTextCases, textOfCases } from './text.utils.data'

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

describe('articleOf', () => {
  it.each([
    { word: 'Based on', article: 'a' },
    { word: 'Applies to', article: 'an' },
    { word: 'Involves', article: 'an' },
  ])('reads the article of $word', ({ word, article }) => {
    expect(articleOf(word)).toBe(article)
  })
})
