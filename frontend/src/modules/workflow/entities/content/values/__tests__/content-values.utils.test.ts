import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import { contentFields, mainField } from '../../fields/content-fields.utils'
import {
  changedFields,
  contentChanges,
  findQuote,
  hasListValue,
  initialValue,
  toStoredContent,
  validateContent,
  valueTitle,
  withoutEmptyEntries,
} from '../content-values.utils'
import {
  changedFieldCases,
  contentChangesCases,
  entryCases,
  findQuoteCases,
  initialValueCases,
  storedContentCases,
  validateCases,
  valueTitleCases,
  withoutEmptyCases,
} from './content-values.utils.data'

describe('validateContent', () => {
  it.each(validateCases)('finds the problems of $name', ({ kind, content, problems }) => {
    const found = validateContent(contentFields(contentSchemaFixtureByKind(kind)), content)

    if (problems === null) expect(found.interview_status).toBeUndefined()
    else expect(found).toEqual(problems)
  })

  it.each([
    { name: 'no entry', value: [], problem: { objectives: 'Add an entry.' } },
    { name: 'one entry', value: ['a'], problem: {} },
  ])('checks minItems with $name', ({ value, problem }) => {
    const fields = contentFields({
      title: 'Plan',
      properties: { objectives: { type: 'array', minItems: 1, items: { type: 'string' } } },
    })

    expect(validateContent(fields, { objectives: value })).toEqual(problem)
  })

  it('checks the bounds of a number', () => {
    const fields = contentFields({
      title: 'Kind',
      properties: { points: { type: 'integer', minimum: 1, maximum: 5 } },
    })

    expect(validateContent(fields, { points: 0 })).toEqual({ points: 'Enter 1 or more.' })
    expect(validateContent(fields, { points: 6 })).toEqual({ points: 'Enter 5 or less.' })
    expect(validateContent(fields, { points: 3 })).toEqual({})
  })

  it('refuses a value of a badge that its field does not offer', () => {
    const fields = contentFields({
      title: 'Kind',
      properties: {
        status: { type: 'string', 'x-ui-widget': 'badge', enum: ['not_started', 'completed'] },
      },
    })

    expect(validateContent(fields, { status: 'bogus' })).toEqual({
      status: 'Choose one of the values.',
    })
  })

  it('checks a separator by the type of its field', () => {
    const fields = contentFields({
      title: 'Kind',
      properties: {
        turn: { type: 'integer', 'x-ui-widget': 'separator', minimum: 1 },
        state: { type: 'string', 'x-ui-widget': 'separator', enum: ['on', 'off'] },
        note: { type: 'string', 'x-ui-widget': 'separator' },
      },
    })

    expect(validateContent(fields, { turn: 0, state: 'nope', note: 'any text' })).toEqual({
      turn: 'Enter 1 or more.',
      state: 'Choose one of the values.',
    })
    expect(validateContent(fields, { turn: 2, state: 'on', note: 'any text' })).toEqual({})
  })
})

describe('hasListValue', () => {
  it.each([
    ['list', true],
    ['tags', true],
    ['object-list', true],
    ['avatar-list', true],
    ['text', false],
    ['textarea', false],
    ['select', false],
    ['number', false],
    ['boolean', false],
    ['separator', false],
    ['badge', false],
  ] as const)('says if %s has a list value: %s', (widget, hasList) => {
    expect(hasListValue({ widget })).toBe(hasList)
  })
})

describe('toStoredContent', () => {
  it.each(storedContentCases)('stores $name', ({ kind, content, stored }) => {
    expect(toStoredContent(contentFields(contentSchemaFixtureByKind(kind)), content)).toMatchObject(
      stored,
    )
  })

  it('leaves out a nullable field that the content does not hold', () => {
    const stored = toStoredContent(contentFields(contentSchemaFixtureByKind('backlog_item')), {
      title: 'x',
    })

    expect(stored).toEqual({ title: 'x' })
  })

  it('stores an emptied nullable field as null', () => {
    const stored = toStoredContent(contentFields(contentSchemaFixtureByKind('backlog_item')), {
      as_a: '',
    })

    expect(stored).toEqual({ as_a: null })
  })

  it.each([
    { name: 'a list', type: 'array', widget: 'list' },
    { name: 'tags', type: 'array', widget: 'tags' },
    { name: 'a list of objects', type: 'array', widget: 'object-list' },
  ])('keeps an emptied nullable $name as an empty list', ({ widget }) => {
    const fields = contentFields({
      title: 'Kind',
      properties: {
        entries: {
          type: ['array', 'null'],
          'x-ui-widget': widget,
          items: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    })

    expect(toStoredContent(fields, { entries: [] })).toEqual({ entries: [] })
  })

  it('leaves out a field that the user cannot edit', () => {
    const stored = toStoredContent(contentFields(contentSchemaFixtureByKind('persona')), {
      interview_status: 'completed',
      name: 'Ann',
    })

    expect(stored).toMatchObject({ name: 'Ann' })
    expect(stored).not.toHaveProperty('interview_status')
  })
})

describe('initialValue', () => {
  it.each(initialValueCases)('starts $name with its value', ({ kind, field, value }) => {
    const contentField = assertPresent(
      contentFields(contentSchemaFixtureByKind(kind)).find(({ name }) => name === field),
      `No field ${field}`,
    )

    expect(initialValue(contentField)).toEqual(value)
  })
})

describe('changedFields', () => {
  it.each(changedFieldCases)('finds $name', ({ before, after, names }) => {
    const fields = contentFields(contentSchemaFixtureByKind('spec_requirement'))

    expect(changedFields(fields, before, after)).toEqual(names)
  })

  it('leaves out a field that the user cannot edit', () => {
    const fields = contentFields(contentSchemaFixtureByKind('persona'))
    const before = { name: 'Ann', interview_status: 'completed' }

    expect(changedFields(fields, before, toStoredContent(fields, before))).toEqual([])
  })

  it.each(entryCases)('compares the entries of an object list: $name', ({ after, names }) => {
    const fields = contentFields(contentSchemaFixtureByKind('backlog_item'))
    const before = { acceptance_criteria: [{ given: 'a', when: 'b', then: 'c' }] }

    expect(changedFields(fields, before, { acceptance_criteria: after })).toEqual(names)
  })
})

describe('valueTitle', () => {
  const definition = {
    value_lists: [
      {
        key: 'priority',
        title: 'Priority',
        values: [{ key: 'must', title: 'Must', description: '' }],
      },
    ],
  }

  it.each(valueTitleCases)('gives $title for $name', ({ list, value, title }) => {
    expect(valueTitle({ valueList: list }, value, definition)).toBe(title)
  })

  it('gives the value while the definition loads', () => {
    expect(valueTitle({ valueList: 'priority' }, 'must', undefined)).toBe('must')
  })
})

describe('contentChanges', () => {
  it.each(contentChangesCases)('finds $name', ({ kind, before, after, changes }) => {
    const found = contentChanges(contentFields(contentSchemaFixtureByKind(kind)), before, after)

    expect(found.map(({ field, before: was, after: is }) => [field.name, was, is])).toEqual(changes)
  })

  it('names the read only fields too, which changedFields leaves out', () => {
    const fields = contentFields(contentSchemaFixtureByKind('persona'))

    const found = contentChanges(
      fields,
      { interview_status: 'completed', name: 'Ann' },
      {
        interview_status: 'completed',
        name: 'Bea',
      },
    )

    expect(found.map(({ field }) => field.name)).toEqual(['name'])
    expect(changedFields(fields, { interview_status: 'completed' }, {})).toEqual([])
  })
})

describe('withoutEmptyEntries', () => {
  it.each(withoutEmptyCases)(
    'drops the entries that hold nothing: $name',
    ({ widget, before, after }) => {
      const fields = contentFields({
        title: 'Kind',
        properties: {
          entries: {
            type: 'array',
            'x-ui-widget': widget,
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, role: { type: 'string' } },
            },
          },
          note: { type: 'string' },
        },
      })

      expect(withoutEmptyEntries(fields, before)).toEqual(after)
    },
  )
})

describe('findQuote', () => {
  it.each(findQuoteCases)('finds the words $name', ({ quote, content, expected }) => {
    const schema = contentSchemaFixtureByKind('spec_requirement')
    // The fields in the order the caller searches them: the main field first, then the rest.
    const main = mainField(schema)
    const ordered =
      main === undefined
        ? contentFields(schema)
        : [main, ...contentFields(schema).filter((field) => field !== main)]

    const found = findQuote(ordered, content, quote)

    expect(found === null ? null : { field: found.field, start: found.range.start }).toEqual(
      expected,
    )
  })

  it('does not search the entries of a list', () => {
    const fields = contentFields({
      title: 'Kind',
      properties: {
        criteria: { type: 'array', 'x-ui-widget': 'list', items: { type: 'string' } },
        statement: { type: 'string', 'x-ui-widget': 'textarea' },
      },
    })

    expect(
      findQuote(fields, { criteria: ['shall list mentors'], statement: 'x' }, 'shall list mentors'),
    ).toBeNull()
  })
})
