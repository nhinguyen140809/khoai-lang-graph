import { describe, expect, it } from 'vitest'

import { assistanceDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { toolUsesLine } from '../tool-uses.utils'
import type { Tool } from '../workflow-vocabulary.types'

const search: Tool = {
  key: 'search',
  title: 'Web search',
  description: 'Searches the web.',
  uses: { one: 'Searched once', other: 'Searched {count} times' },
  icon: 'search',
  acts: [],
}

describe('toolUsesLine', () => {
  it('gives the line of the tool for one use', () => {
    expect(toolUsesLine(search, 1)).toBe('Searched once')
  })

  it('puts the number of uses in the line of the tool for several', () => {
    expect(toolUsesLine(search, 4)).toBe('Searched 4 times')
  })

  // A tool that the assistant reads with shows as a line of its uses, so each one of its definition
  // has words for one use and for several, and no mark or number is left unfilled.
  it.each(assistanceDefinitionFixture.tools.map((tool) => [tool.key, tool] as const))(
    'gives a line for one and for several uses of %s of the assistance workflow',
    (_key, tool) => {
      expect(toolUsesLine(tool, 1).trim()).not.toBe('')
      expect(toolUsesLine(tool, 3)).not.toContain('{count}')
    },
  )
})
