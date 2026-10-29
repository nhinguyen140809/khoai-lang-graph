import { describe, expect, it } from 'vitest'

import { newProjectFormSchemaOf } from '../new-project.schema'
import { invalidFormCases, validFormCases } from './new-project.schema.data'

const newProjectFormSchema = newProjectFormSchemaOf([])

describe('newProjectFormSchema', () => {
  it.each(validFormCases)('$name', ({ form, values }) => {
    expect(newProjectFormSchema.parse(form)).toEqual(values)
  })

  it.each(invalidFormCases)('refuses $name', ({ form, issues }) => {
    const result = newProjectFormSchema.safeParse(form)

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual(issues)
  })
})
