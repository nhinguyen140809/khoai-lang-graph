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

  it('leaves the root of the entities of a module split by topic to the rule of every folder', () => {
    expect(rules['src/modules/run/entities/*/']).toBeUndefined()
    expect(rules['src/modules/project/entities/*/']).toBeDefined()
  })

  it('gives the folder @x to the entities only', () => {
    expect(rules['src/modules/project/entities/*/']).toContain('@x')
    expect(rules['src/modules/project/features/create/*/']).not.toContain('@x')
  })
})
