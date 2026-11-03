import { describe, expect, it } from 'vitest'

import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { contentFields } from '@/modules/workflow/entities'

import { editArtifactFormSchema } from '../edit-artifact.schema'

const fields = contentFields(contentSchemaFixtureByKind('elicitation_plan'))

describe('editArtifactFormSchema', () => {
  it('requires a title', () => {
    const parsed = editArtifactFormSchema(fields).safeParse({ title: '', summary: '', content: {} })

    expect(parsed.error?.issues[0]?.path).toEqual(['title'])
  })

  it('places the problem of a content field at content.<name>', () => {
    const parsed = editArtifactFormSchema(fields).safeParse({
      title: 'Plan',
      summary: '',
      content: {},
    })

    expect(parsed.error?.issues[0]?.path).toEqual(['content', 'objectives'])
  })
})
