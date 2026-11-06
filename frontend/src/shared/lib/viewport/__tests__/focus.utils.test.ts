import { describe, expect, it } from 'vitest'

import { isFocused } from '../focus.utils'

describe('isFocused', () => {
  it('reads whether the element holds the focus of the page', () => {
    const first = document.createElement('button')
    const second = document.createElement('button')
    document.body.append(first, second)

    first.focus()

    expect(isFocused(first)).toBe(true)
    expect(isFocused(second)).toBe(false)
    expect(isFocused(null)).toBe(false)

    first.remove()
    second.remove()
  })
})
