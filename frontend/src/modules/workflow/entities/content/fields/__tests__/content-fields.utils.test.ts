import { describe, expect, it } from 'vitest'

import {
  artifactKindFixtures,
  contentSchemaFixtureByKind,
} from '@/mocks/workflow/artifact-kinds.fixtures'

import { itemDisplays, itemPageLayouts } from '../content-fields.types'
import {
  artifactDisplayOf,
  contentDisplayOf,
  contentFields,
  documentDisplaysByKind,
  extensionField,
  isOneLineField,
  isSeparatorField,
  mainField,
  pageLayoutOf,
  profileFields,
  summaryFields,
} from '../content-fields.utils'
import {
  contentFieldCases,
  displayCases,
  displayFallbackCases,
  fieldOrderCases,
  listFieldCases,
  messageSchema,
  profileSchema,
  transcriptSchema,
  widgetRuleCases,
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
    expect(displays.get('persona_catalog')).toBe('profile')
    expect(displays.get('requirements_analysis')).toBe('table')
  })

  it('is the layout that the artifact kind names, when it is not a document', () => {
    expect(displays.get('interview_transcript')).toBe('transcript')
  })

  it('is a document alone for a kind that holds no item', () => {
    expect(displays.get('elicitation_plan')).toBe('document')
  })

  it('is empty before the kinds load', () => {
    expect(documentDisplaysByKind(undefined).size).toBe(0)
  })

  it('lets the layout that the artifact kind names win over the displays of its items', () => {
    const kinds = {
      workflow_version: 1,
      artifact_kinds: [
        {
          kind: 'interview',
          schema_version: 1,
          schema: transcriptSchema,
          item_kinds: [{ kind: 'message', schema_version: 1, schema: messageSchema }],
        },
      ],
    }

    expect(documentDisplaysByKind(kinds).get('interview')).toBe('transcript')
  })
})

describe('artifactDisplayOf', () => {
  it('reads the layout that an artifact kind names', () => {
    expect(artifactDisplayOf(transcriptSchema)).toBe('transcript')
  })

  it('reads an artifact that names a display of an item as a document', () => {
    expect(
      artifactDisplayOf({ title: 'Kind', 'x-level': 'artifact', 'x-ui-display': 'profile' }),
    ).toBe('document')
  })

  it('reads a document when the kind names no layout', () => {
    expect(artifactDisplayOf({ title: 'Kind', 'x-level': 'artifact' })).toBe('document')
  })
})

describe('pageLayoutOf', () => {
  it('gives a kind with the display profile the page layout of a profile', () => {
    expect(pageLayoutOf(profileSchema)).toBe('profile')
  })

  it('gives every other kind the page of today', () => {
    expect(pageLayoutOf(messageSchema)).toBe('fields')
    expect(pageLayoutOf(contentSchemaFixtureByKind('spec_requirement'))).toBe('fields')
  })

  it('has a row for every display of an item', () => {
    expect(Object.keys(itemPageLayouts).toSorted()).toEqual([...itemDisplays].toSorted())
  })
})

describe('the display of a test kind by level', () => {
  it('reads the display an item kind names', () => {
    expect(contentDisplayOf(profileSchema)).toBe('profile')
  })

  it('reads the layout an artifact kind names', () => {
    expect(contentDisplayOf(transcriptSchema)).toBe('transcript')
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

describe('the rules of each widget', () => {
  it.each(widgetRuleCases)('reads the rules of $widget', ({ widget, isOneLine, isSeparator }) => {
    expect(isOneLineField({ widget })).toBe(isOneLine)
    expect(isSeparatorField({ widget })).toBe(isSeparator)
  })
})

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
