import { describe, expect, it } from 'vitest'

import { jsonToPlainText } from '../json-plain-text.utils'
import { jsonToPlainTextCases } from './json-plain-text.utils.data'

describe('jsonToPlainText', () => {
  it.each(jsonToPlainTextCases)('writes $name', ({ value, text }) => {
    expect(jsonToPlainText(value)).toBe(text)
  })
})
