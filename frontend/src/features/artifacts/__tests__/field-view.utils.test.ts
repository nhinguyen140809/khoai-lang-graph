import { describe, expect, it } from 'vitest'

import { mockArtifactKinds } from '@/mocks/artifact-kinds.fixtures'

import {
  changedFields,
  emptyValue,
  fieldLabel,
  fieldViews,
  formatValue,
  itemTitle,
  listFieldViews,
  toStoredContent,
  validateContent,
} from '../field-view.utils'
import { schemasByKind } from '../kinds.utils'

const schemas = schemasByKind(mockArtifactKinds)

function schemaOf(kind: string) {
  const schema = schemas.get(kind)
  if (schema === undefined) throw new Error(`No schema for ${kind}`)
  return schema
}

describe('fieldLabel', () => {
  it('reads a field name as a label', () => {
    expect(fieldLabel('acceptance_criteria')).toBe('Acceptance criteria')
  })
})

describe('fieldViews', () => {
  const views = fieldViews(schemaOf('spec_requirement'))

  it('lists the fields in the order of the schema', () => {
    expect(views.map(({ name }) => name)).toEqual([
      'title',
      'statement',
      'type',
      'quality_category',
      'priority',
      'rationale',
      'acceptance_criteria',
      'fit_criterion',
      'verification_method',
    ])
  })

  it('takes the widget from the schema, with the options of a select', () => {
    const type = views.find(({ name }) => name === 'type')
    expect(type).toMatchObject({
      widget: 'select',
      nullable: false,
      options: ['functional', 'non_functional', 'constraint'],
    })
    expect(views.find(({ name }) => name === 'acceptance_criteria')?.widget).toBe('list')
    expect(views.find(({ name }) => name === 'statement')?.widget).toBe('textarea')
  })

  it('marks a field that can be null, and a field the user cannot edit', () => {
    expect(views.find(({ name }) => name === 'fit_criterion')?.nullable).toBe(true)
    const status = fieldViews(schemaOf('persona')).find(({ name }) => name === 'interview_status')
    expect(status?.readOnly).toBe(true)
  })

  it('names where a select takes its values from, and the fields of an entry', () => {
    const stakeholder = fieldViews(schemaOf('persona')).find(
      ({ name }) => name === 'stakeholder_type',
    )
    expect(stakeholder?.valueFrom).toBe('elicitation_plan.stakeholder_types')
    const criteria = fieldViews(schemaOf('backlog_item')).find(
      ({ name }) => name === 'acceptance_criteria',
    )
    expect(criteria?.widget).toBe('object-list')
    expect(criteria?.entryFields.map(({ name }) => name)).toEqual(['given', 'when', 'then'])
  })
})

describe('listFieldViews and itemTitle', () => {
  it('lists the fields of a table in the order of the schema, and titles an item by its title field', () => {
    const schema = schemaOf('spec_requirement')
    expect(listFieldViews(schema).map(({ name }) => name)).toEqual([
      'title',
      'type',
      'priority',
      'verification_method',
    ])
    expect(itemTitle(schema, { key: 'REQ-001', content: { title: 'Search mentors' } })).toBe(
      'Search mentors',
    )
    expect(itemTitle(schema, { key: 'REQ-002', content: {} })).toBe('REQ-002')
    expect(itemTitle(undefined, { key: 'X-1', content: { title: 'x' } })).toBe('X-1')
  })
})

describe('validateContent', () => {
  const views = fieldViews(schemaOf('spec_requirement'))
  const valid = {
    title: 'Search mentors',
    statement: 'The system shall list mentors.',
    type: 'functional',
    quality_category: null,
    priority: 'must',
    rationale: 'Because.',
    acceptance_criteria: [],
    fit_criterion: null,
    verification_method: 'test',
  }

  it('accepts a content that follows the schema', () => {
    expect(validateContent(views, valid)).toEqual({})
  })

  it('asks for a field that is required and empty, and for a value that is not offered', () => {
    const problems = validateContent(views, { ...valid, title: '', type: 'wish' })

    expect(problems).toEqual({ title: 'Enter a value.', type: 'Choose one of the values.' })
  })

  it('checks the entries of a list of objects, and the bounds of a number', () => {
    const story = fieldViews(schemaOf('backlog_item'))
    const problems = validateContent(story, {
      item_type: 'user_story',
      title: 'Book',
      as_a: null,
      i_want: null,
      so_that: null,
      acceptance_criteria: [{ given: 'a', when: '', then: 'c' }],
      priority: 'must',
      story_points: 'x',
      delivery_status: 'todo',
    })

    expect(problems.acceptance_criteria).toContain('"When"')
    expect(problems.story_points).toBe('Enter a number.')
  })

  it('leaves out a field that the user cannot edit', () => {
    const persona = fieldViews(schemaOf('persona'))
    expect(validateContent(persona, { interview_status: 'bogus' }).interview_status).toBeUndefined()
  })
})

describe('toStoredContent', () => {
  it('stores numbers as numbers, an empty nullable field as null, and drops a read-only field', () => {
    const story = fieldViews(schemaOf('backlog_item'))
    const stored = toStoredContent(story, { title: 'x', story_points: '5', as_a: '' })

    expect(stored.story_points).toBe(5)
    expect(stored.as_a).toBeNull()
    const persona = fieldViews(schemaOf('persona'))
    expect('interview_status' in toStoredContent(persona, { interview_status: 'completed' })).toBe(
      false,
    )
  })
})

describe('emptyValue, formatValue and changedFields', () => {
  it('start a field, print a value, and find what differs', () => {
    const views = fieldViews(schemaOf('spec_requirement'))
    const fallback = views[0]
    if (fallback === undefined) throw new Error('No field')
    expect(
      emptyValue(views.find(({ name }) => name === 'acceptance_criteria') ?? fallback),
    ).toEqual([])
    expect(formatValue(['a', 'b'])).toBe('a; b')
    expect(formatValue(null)).toBe('-')
    expect(changedFields(views, { title: 'a', type: 'x' }, { title: 'b', type: 'x' })).toEqual([
      'title',
    ])
  })
})
