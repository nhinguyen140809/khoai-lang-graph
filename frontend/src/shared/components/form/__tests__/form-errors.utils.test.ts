import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { fieldProblemsOf, formErrorOf, showFieldProblems } from '../form-errors.utils'
import { failed, fieldPathCases, formErrorCases } from './form-errors.utils.data'

const schema = z.object({
  name: z.string(),
  run_config: z
    .object({
      max_steps: z.string(),
      parameters: z.record(z.string(), z.string()),
    })
    .nullable(),
})

describe('fieldProblemsOf', () => {
  it.each(fieldPathCases)('keeps a problem of $field: $kept', ({ field, kept }) => {
    const problems = fieldProblemsOf(failed([{ field, message: 'Wrong.' }]), schema)

    expect(problems.some((problem) => problem.field === field)).toBe(kept)
  })

  it('reads the fields of a schema that refines or transforms its value', () => {
    const transformed = z
      .object({ current_password: z.string(), again: z.string() })
      .refine(() => true)
      .transform(({ current_password }) => ({ current_password }))

    expect(
      fieldProblemsOf(failed([{ field: 'current_password', message: 'Wrong.' }]), transformed),
    ).toEqual([{ field: 'current_password', message: 'Wrong.' }])
  })

  it('has none for an error that is not of the API', () => {
    expect(fieldProblemsOf(new Error('offline'), schema)).toEqual([])
  })
})

describe('showFieldProblems', () => {
  it('sets the error of each field that a problem names', () => {
    const setError = vi.fn()

    showFieldProblems(
      setError,
      failed([
        { field: 'name', message: 'Enter a name.' },
        { field: 'body', message: 'Malformed JSON.' },
      ]),
      schema,
    )

    expect(setError).toHaveBeenCalledExactlyOnceWith('name', { message: 'Enter a name.' })
  })
})

describe('formErrorOf', () => {
  it.each(formErrorCases)('says $name', ({ error, message }) => {
    expect(formErrorOf(error, schema)).toBe(message)
  })
})
