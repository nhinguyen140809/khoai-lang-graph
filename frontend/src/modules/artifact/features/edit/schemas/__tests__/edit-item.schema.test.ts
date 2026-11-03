import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'

import { editItemFormSchema } from '../edit-item.schema'

const fields = contentFields(contentSchemaFixtureByKind('spec_requirement'))

describe('editItemFormSchema', () => {
  it('places the problem of a content field at content.<name>', () => {
    const parsed = editItemFormSchema(fields).safeParse({
      content: { title: '', statement: 'x', type: 'functional', priority: 'must', rationale: 'r' },
    })

    expect(parsed.error?.issues[0]?.path).toEqual(['content', 'title'])
  })

  it('passes a content that follows its schema', () => {
    expect(
      editItemFormSchema(fields).safeParse({
        content: {
          title: 'Search',
          statement: 'The system.',
          type: 'functional',
          priority: 'must',
          rationale: 'r',
          acceptance_criteria: [],
          verification_method: 'test',
        },
      }).success,
    ).toBe(true)
  })
})
