import { ApiError } from '@/shared/api/error'
import { HttpStatus } from '@/shared/api/http'

/** An API error with the field problems given, as a form gets it. */
export const failed = (fieldErrors: ApiError['fieldErrors']) =>
  new ApiError(
    'Failed to save (HTTP 422)',
    HttpStatus.UnprocessableContent,
    'validation_failed',
    fieldErrors,
  )

/** The field of a problem, and whether it is a path of the form, through objects and records. */
export const fieldPathCases = [
  { field: 'name', kept: true },
  { field: 'run_config.max_steps', kept: true },
  { field: 'run_config.parameters.max_turns', kept: true },
  { field: 'run_config.unknown', kept: false },
  { field: 'name.first', kept: false },
  { field: 'body', kept: false },
]

/** An error, and what the form says under it: nothing when the fields show the problems. */
export const formErrorCases = [
  { name: 'nothing without an error', error: null, message: null },
  {
    name: 'nothing when the problems are shown at their fields',
    error: failed([{ field: 'name', message: 'Enter a name.' }]),
    message: null,
  },
  {
    name: 'the message of a problem of a field the form does not have',
    error: failed([{ field: 'body', message: 'Bad.' }]),
    message: 'Failed to save (HTTP 422)',
  },
  { name: 'the message of an error', error: new Error('offline'), message: 'offline' },
  {
    name: 'a message of its own for anything else',
    error: 'broken',
    message: 'Something went wrong.',
  },
]
