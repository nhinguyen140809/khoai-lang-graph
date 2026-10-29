import { runParameterFields } from '@/modules/workflow/entities/@x/run'

import type { RunDefaults } from '../run-config.types'
import { noRunDefaultsFieldValues } from '../run-defaults.constants'
import type { RunDefaultsFieldValues } from '../run-defaults.schema'

/** The fields of run parameters that the tests of the run settings use. */
export const parameterFields = runParameterFields({
  type: 'object',
  properties: {
    max_turns: { type: 'integer', minimum: 1, maximum: 20, default: 6 },
    strict: { type: 'boolean' },
    note: { type: 'string' },
  },
})

const noDefaults: RunDefaults = {
  review_checkpoints: null,
  max_steps: null,
  max_cost_usd: null,
  parameters: null,
}

/** The values of the fields with nothing set, each parameter of `parameterFields` empty. */
export const emptyValues: RunDefaultsFieldValues = {
  ...noRunDefaultsFieldValues,
  parameters: { max_turns: '', strict: null, note: '' },
}

/** The settings of a level, and the values of the fields that show them. */
export const valuesCases = [
  { name: 'settings left empty', defaults: noDefaults, values: emptyValues },
  {
    name: 'settings that are set',
    defaults: {
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: 80,
      max_cost_usd: 2.5,
      parameters: { max_turns: 6, strict: false, other: null },
    },
    values: {
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: 80,
      max_cost_usd: 2.5,
      parameters: { max_turns: 6, strict: false, note: '' },
    },
  },
]

/** Values of the fields, and the run settings that they send. */
export const sentDefaultsCases = [
  {
    name: 'only the fields that are filled',
    values: {
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: 120,
      max_cost_usd: undefined,
      parameters: { max_turns: '8', strict: null, note: '  ' },
    },
    defaults: {
      review_checkpoints: ['checkpoint_analysis'],
      max_steps: 120,
      max_cost_usd: null,
      parameters: { max_turns: 8 },
    },
  },
  {
    name: 'a flag as a boolean',
    values: { ...emptyValues, parameters: { ...emptyValues.parameters, strict: true } },
    defaults: { ...noDefaults, parameters: { strict: true } },
  },
  {
    name: 'a flag that is unchecked as false',
    values: { ...emptyValues, parameters: { ...emptyValues.parameters, strict: false } },
    defaults: { ...noDefaults, parameters: { strict: false } },
  },
  { name: 'no parameters when none is filled', values: emptyValues, defaults: noDefaults },
]

/** The reviews that are on, a checkbox and its new state, and the reviews after it. */
export const toggleCases = [
  { name: 'a review turned on', current: ['a'], id: 'b', isOn: true, result: ['a', 'b'] },
  { name: 'a review turned off', current: ['a', 'b'], id: 'a', isOn: false, result: ['b'] },
  { name: 'a review turned on twice', current: ['a'], id: 'a', isOn: true, result: ['a'] },
  { name: 'the default of the next level', current: null, id: 'a', isOn: true, result: ['a'] },
]

/** A run parameter that is a choice, for the tests of its keys. */
export const choiceField = runParameterFields({
  type: 'object',
  properties: { mode: { type: 'string', enum: ['fast', 'deep', 'default'] } },
})[0]

/** The value of a choice, and the key of the choice that holds it. */
export const selectKeyCases = [
  { name: 'the first value', value: 'fast', key: '0' },
  { name: 'a value named like the default', value: 'default', key: '2' },
  { name: 'nothing set', value: '', key: 'default' },
  { name: 'a value that is not offered', value: 'slow', key: 'default' },
  { name: 'a value that is not a text', value: null, key: 'default' },
]

/** The key of a choice, and the value that it sets. */
export const selectValueCases = [
  { name: 'a value', key: '1', value: 'deep' },
  { name: 'the default', key: 'default', value: '' },
]

/** Run settings, and whether none of their fields is set. */
export const emptyCases = [
  { name: 'settings left empty', defaults: noDefaults, isEmpty: true },
  { name: 'a limit', defaults: { ...noDefaults, max_steps: 5 }, isEmpty: false },
  { name: 'no review at all', defaults: { ...noDefaults, review_checkpoints: [] }, isEmpty: false },
  {
    name: 'a parameter',
    defaults: { ...noDefaults, parameters: { max_turns: 4 } },
    isEmpty: false,
  },
]

/** The value of the field of the reviews, and the reviews that it selects. */
export const selectedCases = [
  { name: 'a list', value: ['a', 'b'], selected: ['a', 'b'] },
  { name: 'an empty list', value: [], selected: [] },
  { name: 'null', value: null, selected: null },
  { name: 'a value that is not a list', value: 'a', selected: null },
]
