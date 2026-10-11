import { describe, expect, it } from 'vitest'

import type { RunConfigDefinition } from '../run-config.types'
import { parameterFields, runFormOf, toRunConfig, validateRunForm } from '../run-form.utils'

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

describe('validateRunForm', () => {
  const empty = runFormOf({
    review_checkpoints: null,
    max_steps: null,
    max_cost_usd: null,
    parameters: null,
  })

  it('accepts a form that is empty', () => {
    expect(validateRunForm(empty, fields)).toEqual({})
  })

  it('names each field that is out of its limits', () => {
    const problems = validateRunForm(
      { ...empty, maxSteps: '0', maxCost: '-1', parameters: { max_turns: '21' } },
      fields,
    )

    expect(Object.keys(problems).sort()).toEqual([
      'max_cost_usd',
      'max_steps',
      'parameters.max_turns',
    ])
    expect(problems['parameters.max_turns']).toBe('Enter 20 or less.')
  })

  it('does not accept a fraction where a whole number is asked', () => {
    expect(validateRunForm({ ...empty, parameters: { max_turns: '2.5' } }, fields)).toEqual({
      'parameters.max_turns': 'Enter a whole number.',
    })
  })
})

describe('toRunConfig', () => {
  it('sets only the fields that are filled, so that the others take the next level', () => {
    const form = {
      checkpoints: ['checkpoint_analysis'],
      maxSteps: ' 120 ',
      maxCost: '',
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
      toRunConfig({ checkpoints: null, maxSteps: '', maxCost: '', parameters: {} }, fields)
        .parameters,
    ).toBeNull()
  })
})
