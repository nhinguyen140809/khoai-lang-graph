import { describe, expect, it } from 'vitest'

import { allFileKinds, fileKinds } from '../file-kinds.constants.js'
import { kindFileNamePattern, sliceFolderRules } from '../file-names.utils.js'

describe('kindFileNamePattern', () => {
  it('names a file <subject>.<kind>, the subject in kebab-case', () => {
    expect(kindFileNamePattern(['api', 'keys'])).toBe('+([a-z0-9])*(-+([a-z0-9])).@(api|keys)')
  })
})

describe('fileKinds', () => {
  it('has every kind of a place in the list of all kinds', () => {
    for (const kinds of Object.values(fileKinds)) {
      for (const kind of kinds) expect(allFileKinds).toContain(kind)
    }
  })
})

describe('sliceFolderRules', () => {
  const rules = sliceFolderRules()

  it('lets a module hold its layers only', () => {
    expect(rules['src/modules/project/*/']).toBe('@(entities|features|widgets)')
  })

  it('lets the root of the entities of a module split by topic hold its topics, not the kinds', () => {
    expect(rules['src/modules/run/entities/*/']).toBe(
      '@(components|__tests__|@x|config|directives|events|runs|state|status|steps)',
    )
    expect(rules['src/modules/run/entities/*/']).not.toContain('types')
  })

  it('lets a topic hold its components, hooks and tests only', () => {
    expect(rules['src/modules/run/entities/runs/*/']).toBe('@(components|hooks|__tests__)')
  })

  it('lets the root of the entities hold the folder of a group of topics, once', () => {
    const root = rules['src/modules/workflow/entities/*/']
    expect(root).toContain('|content|')
    expect(root).not.toContain('content/')
    expect(root.match(/content/g)).toHaveLength(1)
  })

  it('lets a group of topics hold its topic folders and its components only', () => {
    expect(rules['src/modules/workflow/entities/content/*/']).toBe(
      '@(components|fields|values|value-labels)',
    )
  })

  it('lets a topic in a group hold its components, hooks and tests only', () => {
    expect(rules['src/modules/workflow/entities/content/values/*/']).toBe(
      '@(components|hooks|__tests__)',
    )
  })

  it('lets the entities of a module not split by topic hold a folder for each kind', () => {
    expect(rules['src/modules/thread/entities/*/']).toContain('types')
  })

  it('lets the entities hold a schema file', () => {
    expect(fileKinds.entities).toContain('schema')
    expect(rules['src/modules/thread/entities/*/']).toContain('schemas')
  })

  it('gives the folder @x to the entities only', () => {
    expect(rules['src/modules/project/entities/*/']).toContain('@x')
    expect(rules['src/modules/project/features/create/*/']).not.toContain('@x')
  })
})
