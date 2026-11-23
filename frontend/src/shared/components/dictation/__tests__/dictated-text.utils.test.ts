import { describe, expect, it } from 'vitest'

import { dictatedText } from '../dictated-text.utils'

describe('dictatedText', () => {
  it.each([
    ['', 'hello', 'hello'],
    ['A mentor app', 'for students', 'A mentor app for students'],
    ['A mentor app ', 'for students', 'A mentor app for students'],
    ['A mentor app\n', 'for students', 'A mentor app\nfor students'],
    ['A mentor app', '', 'A mentor app'],
  ])('writes what was heard after %j, which is %j, as %j', (base, heard, text) => {
    expect(dictatedText(base, heard)).toBe(text)
  })
})
