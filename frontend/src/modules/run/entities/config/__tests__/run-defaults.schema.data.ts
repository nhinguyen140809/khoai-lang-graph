import { emptyValues } from './run-defaults.utils.data'

/** Values, and the problem that the schema finds at each field. */
export const problemCases = [
  { name: 'values that are empty', values: emptyValues, problems: {} },
  {
    name: 'each field out of its limits',
    values: {
      ...emptyValues,
      max_steps: 0,
      max_cost_usd: -1,
      parameters: { ...emptyValues.parameters, max_turns: 21 },
    },
    problems: {
      max_steps: 'Enter 1 or more.',
      max_cost_usd: 'Enter an amount above 0.',
      'parameters.max_turns': 'Enter 20 or less.',
    },
  },
  {
    name: 'a fraction where a whole number is asked',
    values: {
      ...emptyValues,
      max_steps: 2.5,
      parameters: { ...emptyValues.parameters, max_turns: 2.5 },
    },
    problems: {
      max_steps: 'Enter a whole number.',
      'parameters.max_turns': 'Enter a whole number.',
    },
  },
  {
    name: 'a flag, which has no limits to check',
    values: { ...emptyValues, parameters: { ...emptyValues.parameters, strict: true } },
    problems: {},
  },
]
