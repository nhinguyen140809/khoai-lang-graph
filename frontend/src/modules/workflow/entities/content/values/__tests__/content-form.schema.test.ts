import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import { contentFields } from '../../fields/content-fields.utils'
import { contentFormValuesSchema, withContentProblems } from '../content-form.schema'

const fields = contentFields(contentSchemaFixtureByKind('spec_requirement'))
const validContent = {
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

describe('withContentProblems', () => {
  const schema = withContentProblems(contentFormValuesSchema, fields)

  it('places the problem of a field at content.<name>', () => {
    const parsed = schema.safeParse({ content: { ...validContent, title: '' } })

    expect(parsed.error?.issues[0]?.path).toEqual(['content', 'title'])
  })

  it('passes a content that follows its schema', () => {
    expect(schema.safeParse({ content: validContent }).success).toBe(true)
  })

  it('stays a ZodObject, so that schemaAt finds the fields of the problems of the API', () => {
    expect(schema).toBeInstanceOf(z.ZodObject)
  })
})
