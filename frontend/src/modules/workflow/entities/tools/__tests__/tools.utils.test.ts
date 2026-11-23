import { describe, expect, it } from 'vitest'

import { actsOf, findTool } from '../tools.utils'

describe('findTool', () => {
  it('gives the tool of the definition with the key', () => {
    const tool = {
      key: 'search',
      title: 'Web search',
      description: 'Searches the web.',
      uses: { one: 'Searched once', other: 'Searched {count} times' },
      icon: 'search',
      acts: [] as string[],
    } as const

    expect(findTool({ tools: [tool] }, 'search')).toEqual(tool)
  })

  it('gives undefined for a key that the definition does not list', () => {
    expect(findTool({ tools: [] }, 'search')).toBeUndefined()
  })
})

describe('actsOf', () => {
  const definition = {
    stages: [
      {
        key: 'research',
        title: 'Research',
        internal: false,
        parent: null,
        acts: ['search', 'read'],
      },
      { key: 'plain', title: 'Plain', internal: false, parent: null, acts: [] },
    ],
    tools: [
      {
        key: 'search',
        title: 'Web search',
        description: 'Searches the web.',
        uses: { one: 'Searched once', other: 'Searched {count} times' },
        icon: 'search' as const,
        acts: ['fetch'],
      },
      {
        key: 'quiet',
        title: 'Quiet',
        description: 'Names no act.',
        uses: { one: 'Once', other: '{count} times' },
        icon: 'tool' as const,
        acts: [],
      },
    ],
  }

  it('gives the acts of the tool in use, in place of those of the stage', () => {
    expect(actsOf(definition, { stage: 'research', tool: 'search' })).toEqual(['fetch'])
  })

  it('gives the acts of the stage for a tool that names none, or no tool', () => {
    expect(actsOf(definition, { stage: 'research', tool: 'quiet' })).toEqual(['search', 'read'])
    expect(actsOf(definition, { stage: 'research', tool: null })).toEqual(['search', 'read'])
  })

  it('gives none for a stage that names none, or one that is not there', () => {
    expect(actsOf(definition, { stage: 'plain', tool: null })).toEqual([])
    expect(actsOf(definition, { stage: 'nothing', tool: 'nothing' })).toEqual([])
    expect(actsOf(definition, { stage: null, tool: null })).toEqual([])
  })
})
