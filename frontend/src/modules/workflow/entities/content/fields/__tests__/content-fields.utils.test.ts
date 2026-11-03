import { describe, expect, it } from 'vitest'

import {
  artifactKindFixtures,
  contentSchemaFixtureByKind,
} from '@/mocks/workflow/artifact-kinds.fixtures'

import {
  contentDisplayOf,
  contentFields,
  documentDisplaysByKind,
  mainField,
  summaryFields,
} from '../content-fields.utils'
import {
  contentFieldCases,
  displayCases,
  displayFallbackCases,
  fieldOrderCases,
  listFieldCases,
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
})

describe('contentDisplayOf', () => {
  it.each(displayCases)('reads the display of $kind', ({ kind, display }) => {
    expect(contentDisplayOf(contentSchemaFixtureByKind(kind))).toBe(display)
  })

  it.each(displayFallbackCases)('falls back for $name', ({ schema, display }) => {
    expect(contentDisplayOf(schema)).toBe(display)
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

describe('summaryFields', () => {
  it.each(listFieldCases)(
    'lists the fields of a table of $kind in the order of the schema',
    ({ kind, names }) => {
      expect(summaryFields(contentSchemaFixtureByKind(kind)).map(({ name }) => name)).toEqual(names)
    },
  )

  it('lists the first three fields when the schema names none', () => {
    const schema = {
      title: 'Kind',
      properties: { a: {}, b: {}, c: {}, d: {} },
    }

    expect(summaryFields(schema).map(({ name }) => name)).toEqual(['a', 'b', 'c'])
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

describe('documentDisplaysByKind', () => {
  const displays = documentDisplaysByKind(artifactKindFixtures)

  it('is the display of the first kind of item that holds content, past the sections', () => {
    expect(displays.get('persona_catalog')).toBe('cards')
    expect(displays.get('requirements_analysis')).toBe('table')
    expect(displays.get('interview_transcript')).toBe('transcript')
  })

  it('is a document alone for a kind that holds no item', () => {
    expect(displays.get('elicitation_plan')).toBe('document')
  })

  it('is empty before the kinds load', () => {
    expect(documentDisplaysByKind(undefined).size).toBe(0)
  })
})
