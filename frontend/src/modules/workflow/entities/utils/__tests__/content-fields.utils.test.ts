import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { contentDisplayOf, contentFields, itemTitle, summaryFields } from '../content-fields.utils'
import {
  contentFieldCases,
  displayCases,
  displayFallbackCases,
  fieldOrderCases,
  itemTitleCases,
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

  it('takes the label from the title of the property, else from the name', () => {
    const labels = contentFields({
      title: 'Kind',
      properties: {
        as_a: { type: 'string', title: 'Role' },
        so_that: { type: 'string' },
      },
    }).map(({ label }) => label)

    expect(labels).toEqual(['Role', 'So that'])
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

describe('itemTitle', () => {
  it.each(itemTitleCases)('names an item by $name', ({ kind, item, title }) => {
    expect(itemTitle(kind === null ? undefined : contentSchemaFixtureByKind(kind), item)).toBe(
      title,
    )
  })
})
