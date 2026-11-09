import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'

import { itemPageViewOf } from '../item-layout.utils'

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
