import { describe, expect, it } from 'vitest'

import { mockArtifactKinds } from '../artifact-kinds.fixtures'

function itemSchema(kind: string): Record<string, unknown> {
  const schema = mockArtifactKinds.artifact_kinds
    .flatMap(({ item_kinds }) => item_kinds)
    .find((itemKind) => itemKind.kind === kind)?.schema
  if (schema === undefined) throw new Error(`No schema for ${kind}`)
  return schema
}

function property(kind: string, name: string): Record<string, unknown> {
  const properties = itemSchema(kind).properties as Record<string, Record<string, unknown>>
  const field = properties[name]
  if (field === undefined) throw new Error(`No field ${name} in ${kind}`)
  return field
}

describe('mockArtifactKinds', () => {
  it('lists the artifact kinds of the definition with their item kinds', () => {
    expect(mockArtifactKinds.artifact_kinds.map(({ kind }) => kind)).toEqual([
      'elicitation_plan',
      'persona_catalog',
      'interview_transcript',
      'requirements_analysis',
      'requirement_specification',
      'product_backlog',
      'validation_report',
    ])
    expect(itemSchema('spec_requirement')).toMatchObject({
      title: 'Specified requirement',
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
