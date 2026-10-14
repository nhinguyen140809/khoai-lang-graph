import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from '@/shared/api/api-error.utils'

import { fieldProblemsOf, formErrorOf, showFieldProblems } from '../form-errors.utils'

const schema = z.object({
  name: z.string(),
  run_config: z
    .object({
      max_steps: z.string(),
      parameters: z.record(z.string(), z.string()),
    })
    .nullable(),
})

const failed = (fieldErrors: ApiError['fieldErrors']) =>
  new ApiError('Failed to save (HTTP 422)', 422, 'validation_failed', fieldErrors)

describe('fieldProblemsOf', () => {
  it('keeps the problems whose field is a path of the form, through objects and records', () => {
    const error = failed([
      { field: 'name', message: 'Enter a name.' },
      { field: 'run_config.max_steps', message: 'Enter a whole number.' },
      { field: 'run_config.parameters.max_turns', message: 'Enter 20 or less.' },
      { field: 'run_config.unknown', message: 'No such field.' },
      { field: 'body', message: 'Malformed JSON.' },
    ])

    expect(fieldProblemsOf(error, schema).map(({ field }) => field)).toEqual([
      'name',
      'run_config.max_steps',
      'run_config.parameters.max_turns',
    ])
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
  it('says nothing without an error, or when the problems are shown at their fields', () => {
    expect(formErrorOf(null, schema)).toBeNull()
    expect(formErrorOf(failed([{ field: 'name', message: 'Enter a name.' }]), schema)).toBeNull()
  })

  it('shows the message for any other failure', () => {
    expect(formErrorOf(failed([{ field: 'body', message: 'Bad.' }]), schema)).toBe(
      'Failed to save (HTTP 422)',
    )
    expect(formErrorOf(new Error('offline'), schema)).toBe('offline')
    expect(formErrorOf('broken', schema)).toBe('Something went wrong.')
  })
})
