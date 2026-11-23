import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import type { ContentSchema } from '../../../artifact-kinds/artifact-kinds.types'
import { profileFields } from '../content-profile.utils'
import { profileSchema } from './content-fields.utils.data'

describe('profileFields', () => {
  it('splits the fields of a kind whose display is a profile', () => {
    const fields = profileFields(profileSchema)

    expect(fields.title?.name).toBe('name')
    expect(fields.line.map(({ name }) => name)).toEqual(['stakeholder_type', 'interview_status'])
    expect(fields.card.map(({ name }) => name)).toEqual(['background', 'goals'])
    expect(fields.body.map(({ name }) => name)).toEqual([
      'background',
      'expertise',
      'goals',
      'interests',
    ])
  })

  it('gives no title for a kind without a title field', () => {
    const fields = profileFields({
      title: 'Kind',
      'x-ui-list-fields': ['a', 'b'],
      properties: { a: { type: 'string' }, b: { type: 'integer' } },
    })

    expect(fields.title).toBeUndefined()
    expect(fields.line.map(({ name }) => name)).toEqual(['a', 'b'])
    expect(fields.card).toEqual([])
    expect(fields.body).toEqual([])
  })
})

describe('the blocks of a profile', () => {
  const persona = contentSchemaFixtureByKind('persona')

  it('gives a formal heading to each block and holds every field of the body once', () => {
    const { sections, body } = profileFields(persona)

    expect(sections.map(({ title }) => title)).toEqual([
      'Personal details',
      'Current practices',
      'Goals and priorities',
      'Concerns and behavior',
      'Product evaluation',
    ])
    const names = sections.flatMap(({ fields }) => fields.map(({ name }) => name))
    expect([...names].sort()).toEqual(body.map(({ name }) => name).sort())
  })

  it('puts the fields that no block names last, in a block with no heading, and drops a block with none of its fields', () => {
    const schema: ContentSchema = {
      title: 'Kind',
      'x-ui-sections': [
        { title: 'First', fields: ['a'] },
        { title: 'Gone', fields: ['missing'] },
      ],
      'x-ui-title-field': 'c',
      'x-ui-list-fields': ['c'],
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
        c: { type: 'string' },
      },
    }
    const { sections } = profileFields(schema)

    expect(sections.map(({ title }) => title)).toEqual(['First', null])
    expect(sections[1]?.fields.map(({ name }) => name)).toEqual(['b'])
  })

  it('has no blocks when the schema names none', () => {
    expect(profileFields(profileSchema).sections).toEqual([])
  })
})
