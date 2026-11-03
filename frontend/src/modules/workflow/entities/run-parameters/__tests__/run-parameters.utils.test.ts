import { describe, expect, it } from 'vitest'

import {
  runParameterFields,
  runParameterProblems,
  runParameterValuesOf,
  sentRunParameters,
} from '../run-parameters.utils'
import { fieldCases, parametersSchema, problemCases, sentCases } from './run-parameters.utils.data'

const fields = runParameterFields(parametersSchema)

describe('runParameterFields', () => {
  it('makes a field of each property that has a widget, in the order of the schema', () => {
    expect(fields.map(({ name }) => name)).toEqual([
      'max_turns',
      'budget',
      'strict',
      'mode',
      'note',
    ])
  })

  it.each(fieldCases)('reads $name', ({ property, field }) => {
    expect(fields.find(({ name }) => name === property)).toMatchObject(field)
  })

  it('makes a text of a property that is not a field schema', () => {
    const [field] = runParameterFields({ type: 'object', properties: { value: 'not a schema' } })

    expect(field).toMatchObject({ widget: 'text', minimum: null, maximum: null })
  })
})

describe('runParameterValuesOf', () => {
  it('starts a parameter that is not stored as unset: empty, and null for a flag', () => {
    expect(runParameterValuesOf(fields, null)).toEqual({
      max_turns: '',
      budget: '',
      strict: null,
      mode: '',
      note: '',
    })
  })

  it('keeps the values that are stored, a false flag included', () => {
    expect(runParameterValuesOf(fields, { max_turns: 6, strict: false, other: 1 })).toMatchObject({
      max_turns: 6,
      strict: false,
    })
  })
})

describe('runParameterProblems', () => {
  it.each(problemCases)('finds the problems of $name', ({ values, problems }) => {
    expect(runParameterProblems(fields, values)).toEqual(problems)
  })
})

describe('sentRunParameters', () => {
  it.each(sentCases)('sends $name', ({ values, sent }) => {
    expect(sentRunParameters(fields, values)).toEqual(sent)
  })
})
