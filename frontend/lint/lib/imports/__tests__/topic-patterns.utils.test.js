import { describe, expect, it } from 'vitest'

import { entityTopics, topicPatterns } from '../topic-patterns.utils.js'

/**
 * @param {object[]} patterns
 * @param {string} source the path of an import
 */
function isRejected(patterns, source) {
  return patterns.some(
    (pattern) => 'regex' in pattern && new RegExp(String(pattern.regex)).test(source),
  )
}

describe('entityTopics', () => {
  it('lists the topics of a module split by topic, and none for another module', () => {
    expect(entityTopics('run')).toContain('steps')
    expect(entityTopics('project')).toEqual([])
  })
})

describe('topicPatterns', () => {
  it('lets a topic read the topics under it, from its files and from its hooks', () => {
    const patterns = topicPatterns('run', 'steps')
    expect(isRejected(patterns, '../runs/runs.utils')).toBe(false)
    expect(isRejected(patterns, '../../runs/run-queries.types')).toBe(false)
    expect(isRejected(patterns, '../status/run-status.types')).toBe(false)
  })

  it('lets a topic read its own files', () => {
    const patterns = topicPatterns('run', 'steps')
    expect(isRejected(patterns, './run-steps.utils')).toBe(false)
    expect(isRejected(patterns, '../run-steps.api')).toBe(false)
  })

  it('keeps a topic from the topics beside it or above it, and from the components', () => {
    expect(isRejected(topicPatterns('run', 'steps'), '../state/run-state.types')).toBe(true)
    expect(isRejected(topicPatterns('run', 'runs'), '../steps/run-steps.types')).toBe(true)
    expect(isRejected(topicPatterns('run', 'events'), '../../runs/runs.utils')).toBe(true)
    expect(isRejected(topicPatterns('run', 'config'), '../components/RunDefaultsFields')).toBe(true)
  })

  it('throws for a topic that the module does not list', () => {
    expect(() => topicPatterns('run', 'graph')).toThrow('topicEntityModules')
  })
})
