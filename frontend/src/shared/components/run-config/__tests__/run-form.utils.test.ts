import { describe, expect, it } from 'vitest'

import type { RunConfigDefinition } from '../run-config.types'
import { runFormSchema } from '../run-form.schema'
import { parameterFields, runFormOf, toRunConfig } from '../run-form.utils'

const definition: RunConfigDefinition = {
  version: 1,
  nodes: [],
  agent_roles: [],
  run_parameters_schema: {
    properties: {
      max_turns: { type: 'integer', minimum: 1, maximum: 20, default: 6, description: 'Turns.' },
      strict: { type: 'boolean' },
    },
  },
}
const fields = parameterFields(definition)

describe('parameterFields', () => {
  it('makes a field of each property of the schema, in its order, with its limits', () => {
    expect(fields.map(({ key, label, kind }) => [key, label, kind])).toEqual([
      ['max_turns', 'Max turns', 'number'],
      ['strict', 'Strict', 'boolean'],
    ])
    expect(fields[0]).toMatchObject({ integer: true, min: 1, max: 20, default: 6 })
  })
})

describe('runFormOf', () => {
  it('gives every parameter a field, empty when the settings leave it out', () => {
    expect(
      runFormOf(
        {
          review_checkpoints: ['c1'],
          max_steps: 80,
          max_cost_usd: null,
          parameters: { max_turns: 8 },
        },
        fields,
      ),
    ).toEqual({
      review_checkpoints: ['c1'],
      max_steps: '80',
      max_cost_usd: '',
      parameters: { max_turns: '8', strict: '' },
    })
  })
})

describe('runFormSchema', () => {
  const schema = runFormSchema(fields)
  const empty = runFormOf(
    { review_checkpoints: null, max_steps: null, max_cost_usd: null, parameters: null },
    fields,
  )
  const problems = (form: typeof empty) => {
    const result = schema.safeParse(form)
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map(({ path, message }) => [path.join('.'), message]),
        )
  }

  it('accepts a form that is empty, and gives the run settings to send', () => {
    expect(schema.parse(empty)).toEqual({
      review_checkpoints: null,
      max_steps: null,
      max_cost_usd: null,
      parameters: null,
    })
  })

  it('names each field that is out of its limits', () => {
    expect(
      problems({ ...empty, max_steps: '0', max_cost_usd: '-1', parameters: { max_turns: '21' } }),
    ).toEqual({
      max_steps: 'Enter 1 or more.',
      max_cost_usd: 'Enter an amount above 0.',
      'parameters.max_turns': 'Enter 20 or less.',
    })
  })

  it('does not accept a fraction where a whole number is asked', () => {
    expect(problems({ ...empty, parameters: { max_turns: '2.5' } })).toEqual({
      'parameters.max_turns': 'Enter a whole number.',
    })
  })
})

describe('toRunConfig', () => {
  it('sets only the fields that are filled, so that the others take the next level', () => {
    const form = {
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: ' 120 ',
      max_cost_usd: '',
      parameters: { max_turns: '8', strict: '' },
    }

    expect(toRunConfig(form, fields)).toEqual({
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: 120,
      max_cost_usd: null,
      parameters: { max_turns: 8 },
    })
  })

  it('sends no parameters when none is filled', () => {
    expect(
      toRunConfig(
        { review_checkpoints: null, max_steps: '', max_cost_usd: '', parameters: {} },
        fields,
      ).parameters,
    ).toBeNull()
  })
})
