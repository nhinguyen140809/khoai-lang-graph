import { describe, expect, it } from 'vitest'

import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'

import { contentSchemasByKind, hasItemBlocks, kindSchemasByKind } from '../kind-schemas.utils'
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

describe('hasItemBlocks', () => {
  it('is true for a document of items that open one by one, and false for one of text alone', () => {
    expect(hasItemBlocks(artifactKindFixtures, 'persona_catalog')).toBe(true)
    expect(hasItemBlocks(artifactKindFixtures, 'interview_transcript')).toBe(false)
    expect(hasItemBlocks(artifactKindFixtures, 'elicitation_plan')).toBe(false)
  })

  it('is false for a kind that is not there, and before the kinds have loaded', () => {
    expect(hasItemBlocks(artifactKindFixtures, 'no_such_kind')).toBe(false)
    expect(hasItemBlocks(undefined, 'persona_catalog')).toBe(false)
  })
})
