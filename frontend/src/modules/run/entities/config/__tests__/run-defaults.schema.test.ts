import { describe, expect, it } from 'vitest'

import { runDefaultsFieldsSchema } from '../run-defaults.schema'
import { problemCases } from './run-defaults.schema.data'
import { parameterFields } from './run-defaults.utils.data'

describe('runDefaultsFieldsSchema', () => {
  it.each(problemCases)('finds the problems of $name', ({ values, problems }) => {
    const result = runDefaultsFieldsSchema(parameterFields).safeParse(values)

    const found = Object.fromEntries(
      (result.error?.issues ?? []).map(({ path, message }) => [path.join('.'), message]),
    )
    expect(found).toEqual(problems)
  })
})
