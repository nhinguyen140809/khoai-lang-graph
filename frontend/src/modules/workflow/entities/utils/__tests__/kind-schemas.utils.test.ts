import { describe, expect, it } from 'vitest'

import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'

import { contentSchemasByKind, kindSchemasByKind } from '../kind-schemas.utils'
import { kindCases } from './kind-schemas.utils.data'

describe('kindSchemasByKind', () => {
  it.each(kindCases)('maps $kind to its schema and its version', ({ kind, title, version }) => {
    const found = kindSchemasByKind(artifactKindFixtures).get(kind)

    expect(found?.schema.title).toBe(title)
    expect(found?.schema_version).toBe(version)
  })

  it('maps nothing before the kinds have loaded', () => {
    expect(kindSchemasByKind(undefined).size).toBe(0)
  })
})

describe('contentSchemasByKind', () => {
  it.each(kindCases)('maps $kind to its schema alone', ({ kind, title }) => {
    expect(contentSchemasByKind(artifactKindFixtures).get(kind)?.title).toBe(title)
  })

  it('maps nothing before the kinds have loaded', () => {
    expect(contentSchemasByKind(undefined).size).toBe(0)
  })
})
