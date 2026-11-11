import { describe, expect, it } from 'vitest'

import { toolUsesLine } from '../tool-uses.utils'
import type { Tool } from '../workflow-vocabulary.types'

const search: Tool = {
  key: 'search',
  title: 'Web search',
  description: 'Searches the web.',
  uses: { one: 'Searched once', other: 'Searched {count} times' },
  icon: 'search',
}

describe('toolUsesLine', () => {
  it('gives the line of the tool for one use', () => {
    expect(toolUsesLine(search, 1)).toBe('Searched once')
  })

  it('puts the number of uses in the line of the tool for several', () => {
    expect(toolUsesLine(search, 4)).toBe('Searched 4 times')
  })
})
