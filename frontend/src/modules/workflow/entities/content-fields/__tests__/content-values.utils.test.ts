import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import { contentFields } from '../content-fields.utils'
import {
  changedFields,
  initialValue,
  toStoredContent,
  validateContent,
} from '../content-values.utils'
import {
  changedFieldCases,
  entryCases,
  initialValueCases,
  storedContentCases,
  validateCases,
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
