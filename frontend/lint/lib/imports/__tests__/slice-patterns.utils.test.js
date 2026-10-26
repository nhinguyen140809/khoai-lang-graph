import { describe, expect, it } from 'vitest'

import { messages } from '../messages.constants.js'
import { FileScope } from '../slice-patterns.constants.js'
import { modulePatterns } from '../slice-patterns.utils.js'

/**
 * @param {object[]} patterns
 * @param {string} source the path of an import
 */
function reasonsToReject(patterns, source) {
  return patterns
    .filter((pattern) => 'regex' in pattern && new RegExp(String(pattern.regex)).test(source))
    .map((pattern) => String(pattern.message))
}

describe('modulePatterns', () => {
  it('lets a module import the modules under it and no other', () => {
    const patterns = modulePatterns('run', 'features', FileScope.Source)
    expect(reasonsToReject(patterns, '@/modules/artifact/entities')).toHaveLength(0)
    expect(reasonsToReject(patterns, '@/modules/project/entities')).toContain(messages.moduleOrder)
  })

  it('keeps a layer from importing the layers above it', () => {
    const patterns = modulePatterns('run', 'entities', FileScope.Source)
    expect(reasonsToReject(patterns, '@/modules/run/widgets')).not.toHaveLength(0)
    expect(reasonsToReject(patterns, '../../app/layout')).not.toHaveLength(0)
  })

  it('keeps a widget from importing another widget, except in a unit test', () => {
    const importOfWidget = '@/modules/run/widgets'
    expect(
      reasonsToReject(modulePatterns('run', 'widgets', FileScope.Source), importOfWidget),
    ).toContain('A widget never imports another widget. Compose widgets in src/app/.')
    expect(
      reasonsToReject(modulePatterns('run', 'widgets', FileScope.Test), importOfWidget),
    ).toHaveLength(0)
  })

  it('lets an entity reach another entity only through the file @x of its module', () => {
    const patterns = modulePatterns('run', 'entities', FileScope.Source)
    expect(reasonsToReject(patterns, '@/modules/artifact/entities/@x/run')).toHaveLength(0)
    expect(reasonsToReject(patterns, '@/modules/artifact/entities')).not.toHaveLength(0)
  })
})
