import {
  type RunParameterField,
  runParameterValuesOf,
  sentRunParameters,
} from '@/modules/workflow/entities/@x/run'
import { isString } from '@/shared/lib/guards'

import type { RunDefaults } from './run-config.types'
import { defaultSelectKey, runDefaultsMessages } from './run-defaults.constants'
import type { RunDefaultsFieldValues } from './run-defaults.schema'

/** The values of the fields of the run settings of a level; a parameter not set starts empty. */
export function runDefaultsFieldValuesOf(
  defaults: RunDefaults,
  parameterFields: RunParameterField[],
): RunDefaultsFieldValues {
  return {
    review_checkpoints: defaults.review_checkpoints,
    max_steps: defaults.max_steps ?? undefined,
    max_cost_usd: defaults.max_cost_usd ?? undefined,
    parameters: runParameterValuesOf(parameterFields, defaults.parameters),
  }
}

/**
 * The default of a run parameter as a form shows it: "On" or "Off" for a flag, the value for any
 * other; null when the parameter has none.
 */
export function defaultTextOf(field: RunParameterField): string | null {
  const value = field.defaultValue
  if (typeof value === 'boolean')
    return value ? runDefaultsMessages.flagOn : runDefaultsMessages.flagOff
  if (isString(value) || typeof value === 'number') return String(value)
  return null
}

/** The choice that leaves a flag to the next level, with the default that it brings when known. */
export function defaultChoiceLabelOf(field: RunParameterField): string {
  const text = defaultTextOf(field)
  return text === null
    ? runDefaultsMessages.defaultChoice
    : `${runDefaultsMessages.defaultChoice} (${text})`
}

/**
 * The key of the choice of a select that holds this value: the position of the value among the
 * options, or the key of the default while nothing is set. A position never equals a value, so no
 * option can be taken for the default.
 */
export function selectKeyOf(field: RunParameterField, value: unknown): string {
  const index = isString(value) ? field.options.indexOf(value) : -1
  return index === -1 ? defaultSelectKey : String(index)
}

/** The value of a select for the key of a choice: empty for the default, which is not sent. */
export function selectValueOf(field: RunParameterField, key: string): string {
  return field.options[Number(key)] ?? ''
}

/** The run settings to send; a field that is empty is not set, so the next level supplies it. */
export function toRunDefaults(
  values: RunDefaultsFieldValues,
  parameterFields: RunParameterField[],
): RunDefaults {
  const sent = sentRunParameters(parameterFields, values.parameters)
  return {
    review_checkpoints: values.review_checkpoints,
    max_steps: values.max_steps ?? null,
    max_cost_usd: values.max_cost_usd ?? null,
    parameters: Object.keys(sent).length === 0 ? null : sent,
  }
}

/**
 * The reviews that are on after one checkbox changed. `null` is the default of the next level, and
 * turning one review on or off leaves it.
 */
export function toggledCheckpoints(
  current: string[] | null,
  checkpointId: string,
  isOn: boolean,
): string[] {
  const others = (current ?? []).filter((id) => id !== checkpointId)
  return isOn ? [...others, checkpointId] : others
}

/** Whether no field of the run settings is set, so that there is nothing to save. */
export function isRunDefaultsEmpty(defaults: RunDefaults): boolean {
  return Object.values(defaults).every((value) => value === null)
}

/** The reviews that a form field holds: a list, or `null` for the default of the next level. */
export function selectedCheckpoints(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter(isString) : null
}
