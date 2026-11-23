import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'

import { filledFields, filledSections, itemPageViewOf } from '../item-layout.utils'

describe('itemPageViewOf', () => {
  it('leads a profile with an avatar and sets its fields of one line on the key line', () => {
    const view = itemPageViewOf(contentSchemaFixtureByKind('persona'))

    expect(view.layout).toBe('profile')
    expect(view.hasAvatar).toBe(true)
    expect(view.keyLineFields.map(({ name }) => name)).toContain('stakeholder_type')
  })

  it('keeps the fields of the key line out of the body of a profile', () => {
    const view = itemPageViewOf(contentSchemaFixtureByKind('persona'))

    const line = view.keyLineFields.map(({ name }) => name)
    expect(view.bodyFields.map(({ name }) => name).filter((name) => line.includes(name))).toEqual(
      [],
    )
  })

  it('draws every field in the body of any other page, with no avatar and no key line field', () => {
    const schema = contentSchemaFixtureByKind('spec_requirement')

    const view = itemPageViewOf(schema)

    expect(view.layout).toBe('fields')
    expect(view.hasAvatar).toBe(false)
    expect(view.keyLineFields).toEqual([])
    expect(view.bodyFields).toEqual(contentFields(schema))
  })
})

describe('filledFields and filledSections', () => {
  const persona = itemFixtureByKey(projectIds.mentor, 'PER-001')
  const view = itemPageViewOf(contentSchemaFixtureByKind('persona'))

  it('keep the fields that the item has a value for, in their order', () => {
    const names = filledFields(persona, view.bodyFields).map(({ name }) => name)

    expect(names.every((name) => persona.content[name] !== undefined)).toBe(true)
    expect(names).toContain('goals')
  })

  it('keep the blocks that have such a field, with only those fields', () => {
    const sections = filledSections(persona, view.sections)

    expect(sections.length).toBeGreaterThan(0)
    for (const { fields } of sections) expect(fields.length).toBeGreaterThan(0)
  })

  it('drop a block whose fields the item has no value for', () => {
    const bare = { ...persona, content: {} }

    expect(filledSections(bare, view.sections)).toEqual([])
  })
})
