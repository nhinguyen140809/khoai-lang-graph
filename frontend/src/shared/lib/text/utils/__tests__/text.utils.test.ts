import { describe, expect, it } from 'vitest'

import { foldText, hasTextPart, textOf } from '../text.utils'
import { foldTextCases, includesTextCases, textOfCases } from './text.utils.data'

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
