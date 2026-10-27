import { describe, expect, it } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'

import { artifactKindFixtures, findKind, itemKindsOf } from '../artifact-kinds.fixtures'

function itemSchema(kind: string): Record<string, unknown> {
  const itemKind = artifactKindFixtures.artifact_kinds
    .flatMap(({ item_kinds }) => item_kinds)
    .find((entry) => entry.kind === kind)
  return assertPresent(itemKind, `No schema for ${kind}`).schema
}

function property(kind: string, name: string): Record<string, unknown> {
  const properties = itemSchema(kind).properties as Record<string, Record<string, unknown>>
  return assertPresent(properties[name], `No field ${name} in ${kind}`)
}

describe('artifactKindFixtures', () => {
  it('lists the artifact kinds of the definition with their item kinds', () => {
    expect(artifactKindFixtures.artifact_kinds.map(({ kind }) => kind)).toEqual([
      'elicitation_plan',
      'persona_catalog',
      'interview_transcript',
      'requirements_analysis',
      'requirement_specification',
      'product_backlog',
      'validation_report',
    ])
    expect(itemSchema('spec_requirement')).toMatchObject({
      title: 'Requirement',
      'x-key-prefix': 'REQ',
      'x-ui-display': 'table',
    })
  })

  it('fills the enum of a field that names a value list, as the API serves it', () => {
    expect(property('spec_requirement', 'priority').enum).toEqual([
      'must',
      'should',
      'could',
      'wont',
    ])
    expect(property('spec_requirement', 'quality_category').enum).toContain(null)
    expect(property('spec_requirement', 'priority').description).toContain(
      'must: The product fails a stakeholder',
    )
  })
})

describe('findKind', () => {
  it('finds an artifact kind and an item kind', () => {
    expect(findKind('requirement_specification')?.schema.title).toBe('Requirement specification')
    expect(findKind('spec_requirement')?.schema_version).toBe(1)
  })

  it('finds no kind that the definition does not have', () => {
    expect(findKind('unknown')).toBeUndefined()
  })
})

describe('itemKindsOf', () => {
  it('lists the item kinds that an artifact kind holds', () => {
    expect(itemKindsOf('requirement_specification').map(({ kind }) => kind)).toEqual([
      'section',
      'spec_requirement',
    ])
    expect(itemKindsOf('elicitation_plan')).toEqual([])
    expect(itemKindsOf('unknown')).toEqual([])
  })
})
