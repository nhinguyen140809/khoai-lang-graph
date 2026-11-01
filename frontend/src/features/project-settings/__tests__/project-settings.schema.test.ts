import { describe, expect, it } from 'vitest'

import { generalFormSchema, modelsFormSchema } from '../project-settings.schema'

describe('generalFormSchema', () => {
  it('trims the fields and sends an empty description as null', () => {
    expect(
      generalFormSchema.parse({ name: ' Mentors ', description: '', output_language: 'vi' }),
    ).toEqual({ name: 'Mentors', description: null, output_language: 'vi' })
  })
})

describe('modelsFormSchema', () => {
  it('leaves out the roles that take the model of the user', () => {
    expect(modelsFormSchema.parse({ model_overrides: { analyst: 'model-a', writer: '' } })).toEqual(
      { model_overrides: { analyst: 'model-a' } },
    )
  })
})
