import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import type { ContentSchema, SchemaProperty } from '../../../artifact-kinds/artifact-kinds.types'
import { ratingGroups } from '../../values/content-values.utils'
import { contentFields, extensionField, mainField, shownFields } from '../content-fields.utils'
import { profileFields } from '../content-profile.utils'
import {
  contentFieldCases,
  fieldOrderCases,
  messageSchema,
  profileSchema,
  transcriptSchema,
} from './content-fields.utils.data'

describe('contentFields', () => {
  it.each(fieldOrderCases)(
    'lists the fields of $kind in the order of its schema',
    ({ kind, names }) => {
      expect(contentFields(contentSchemaFixtureByKind(kind)).map(({ name }) => name)).toEqual(names)
    },
  )

  it('lists first the fields that the schema orders, then the others', () => {
    const schema = {
      title: 'Kind',
      'x-ui-field-order': ['b'],
      properties: { a: { type: 'string' as const }, b: { type: 'string' as const } },
    }

    expect(contentFields(schema).map(({ name }) => name)).toEqual(['b', 'a'])
  })

  it.each(contentFieldCases)('reads $name', ({ kind, field, contentField }) => {
    const found = contentFields(contentSchemaFixtureByKind(kind)).find(({ name }) => name === field)

    expect(found).toMatchObject(contentField)
  })

  it('takes the title from the title of the property, else from the name', () => {
    const titles = contentFields({
      title: 'Kind',
      properties: {
        as_a: { type: 'string', title: 'Role' },
        so_that: { type: 'string' },
      },
    }).map(({ title }) => title)

    expect(titles).toEqual(['Role', 'So that'])
  })

  it('takes the widget from the type when the schema names none', () => {
    const widgets = contentFields({
      title: 'Kind',
      properties: {
        count: { type: 'integer' },
        names: { type: 'array' },
        kind: { enum: ['a', 'b'] },
        note: { type: ['string', 'null'] },
      },
    }).map(({ name, widget }) => [name, widget])

    expect(widgets).toEqual([
      ['count', 'number'],
      ['names', 'list'],
      ['kind', 'select'],
      ['note', 'text'],
    ])
  })

  it('reads the separator, avatar list and badge widgets from x-ui-widget', () => {
    const widgets = [...contentFields(transcriptSchema), ...contentFields(profileSchema)].map(
      ({ name, widget }) => [name, widget],
    )

    expect(widgets).toContainEqual(['participants', 'avatar-list'])
    expect(widgets).toContainEqual(['status', 'separator'])
    expect(widgets).toContainEqual(['interview_status', 'badge'])
  })
})

describe('a rating list', () => {
  const entries: NonNullable<SchemaProperty['items']> = {
    type: 'object',
    properties: {
      aspect: { title: 'Aspect', type: 'string' },
      score: { title: 'Score', type: 'integer', minimum: 1, maximum: 5 },
      rationale: { title: 'Why', type: 'string' },
    },
    required: ['aspect', 'score', 'rationale'],
  }

  function ratingSchema(keywords: Record<string, string>): ContentSchema {
    return {
      title: 'Person',
      'x-level': 'item',
      properties: {
        scores: {
          title: 'Scores',
          type: 'array',
          'x-ui-widget': 'rating-list',
          items: entries,
          ...keywords,
        },
      },
    }
  }

  it('reads which fields of an entry are the label, the rating and the note, and the scale', () => {
    const [scores] = contentFields(
      ratingSchema({
        'x-ui-label-field': 'aspect',
        'x-ui-value-field': 'score',
        'x-ui-note-field': 'rationale',
      }),
    )

    expect(scores?.widget).toBe('rating-list')
    expect(scores?.rating).toEqual({
      label: 'aspect',
      value: 'score',
      note: 'rationale',
      group: null,
      min: 1,
      max: 5,
    })
    expect(scores?.entryFields.map(({ name }) => name)).toEqual(['aspect', 'score', 'rationale'])
  })

  it('reads the field that heads the group of an entry, and groups the entries by its text', () => {
    const [scores] = contentFields(
      ratingSchema({
        'x-ui-label-field': 'aspect',
        'x-ui-value-field': 'score',
        'x-ui-group-field': 'group',
      }),
    )
    const rating = scores?.rating ?? null

    expect(rating?.group).toBe('group')
    expect(
      ratingGroups(rating ?? { group: null }, [
        { aspect: 'a', group: 'First' },
        { aspect: 'b', group: 'Second' },
        { aspect: 'c', group: 'First' },
        { aspect: 'd' },
      ]).map(({ heading, entries }) => [heading, entries.length]),
    ).toEqual([
      ['First', 2],
      ['Second', 1],
      [null, 1],
    ])
  })

  it('has no rating fields when the schema names no label or value field', () => {
    const [scores] = contentFields(ratingSchema({ 'x-ui-value-field': 'score' }))

    expect(scores?.rating).toBeNull()
  })

  it('has none for another widget', () => {
    expect(contentFields(messageSchema).every(({ rating }) => rating === null)).toBe(true)
  })
})

describe('valueList', () => {
  it('reads the value list that a property names', () => {
    const fields = contentFields({
      title: 'Kind',
      properties: {
        priority: { type: 'string', 'x-value-list': 'priority' },
        note: { type: 'string' },
      },
    })

    expect(fields.map(({ valueList }) => valueList)).toEqual(['priority', null])
  })
})

describe('mainField', () => {
  it('gives the first field that is not the title field: what the item says', () => {
    const main = mainField(contentSchemaFixtureByKind('spec_requirement'))

    expect(main?.name).toBe('statement')
  })

  it('gives no field for a schema that holds its title field only', () => {
    const main = mainField({
      title: 'Kind',
      'x-ui-title-field': 'title',
      properties: { title: { type: 'string' } },
    })

    expect(main).toBeUndefined()
  })
})

describe('extensionField', () => {
  it('reads the field that each keyword names', () => {
    expect(extensionField(profileSchema, 'x-ui-title-field')?.name).toBe('name')
    expect(extensionField(messageSchema, 'x-ui-role-field')?.name).toBe('speaker')
    expect(extensionField(transcriptSchema, 'x-ui-participants-field')?.name).toBe('participants')
  })

  it('gives no field for a kind without the keyword, or a name that is not a property', () => {
    expect(extensionField(transcriptSchema, 'x-ui-role-field')).toBeUndefined()
    expect(
      extensionField(
        { title: 'Kind', 'x-ui-title-field': 'missing', properties: { name: { type: 'string' } } },
        'x-ui-title-field',
      ),
    ).toBeUndefined()
  })
})

describe('the field that groups the items of a kind', () => {
  it('is the field that x-ui-group-by names, read as the other extensions are', () => {
    const observation = contentSchemaFixtureByKind('stakeholder_observation')

    expect(extensionField(observation, 'x-ui-group-by')?.name).toBe('stakeholder_name')
    expect(extensionField(contentSchemaFixtureByKind('persona'), 'x-ui-group-by')).toBeUndefined()
  })
})

describe('a field that the page hides', () => {
  const persona = contentSchemaFixtureByKind('persona')

  it('is known to the schema, and is left out of what a page shows', () => {
    const hidden = contentFields(persona).filter((field) => field.isHidden)

    expect(hidden.map(({ name }) => name)).toEqual(['grounded_in', 'evidence', 'face'])
    expect(shownFields(persona).map(({ name }) => name)).not.toContain('evidence')
    const body = profileFields(persona).body.map(({ name }) => name)
    expect(body).not.toContain('grounded_in')
    expect(body).not.toContain('evidence')
  })

  it('has no block for what a persona is based on, since its links say it', () => {
    const titles = profileFields(persona).sections.map(({ title }) => title)

    expect(titles).not.toContain('Supporting evidence')
    expect(titles).toContain('Product evaluation')
  })
})
