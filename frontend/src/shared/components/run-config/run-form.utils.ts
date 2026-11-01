import type { ParameterSchema, RunConfig, RunConfigDefinition } from './run-config.types'

export interface ParameterField {
  key: string
  label: string
  kind: 'number' | 'boolean' | 'text'
  integer: boolean
  min: number | undefined
  max: number | undefined
  default: unknown
  description: string | undefined
}

/** `max_turns` as "Max turns". */
export function humanize(key: string): string {
  const text = key.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function kindOf(schema: ParameterSchema): ParameterField['kind'] {
  if (schema.type === 'integer' || schema.type === 'number') return 'number'
  return schema.type === 'boolean' ? 'boolean' : 'text'
}

/** The fields of the run parameters, in the order that the schema lists them. */
export function parameterFields(definition: RunConfigDefinition): ParameterField[] {
  return Object.entries(definition.run_parameters_schema.properties).map(([key, schema]) => ({
    key,
    label: humanize(key),
    kind: kindOf(schema),
    integer: schema.type === 'integer',
    min: schema.minimum,
    max: schema.maximum,
    default: schema.default,
    description: schema.description,
  }))
}

/**
 * The run settings as a form holds them, named as the request names them: text for every number,
 * so that an empty field is empty.
 */
export interface RunForm {
  /** Null when the checkpoints are left to the next level. */
  review_checkpoints: string[] | null
  max_steps: string
  max_cost_usd: string
  parameters: Record<string, string>
}

/** A number, text or flag as text; anything else, and nothing, as an empty text. */
export function scalarText(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
    ? String(value)
    : ''
}

const textOf = scalarText

/** The form of the run settings `config`, with a field for each parameter of `fields`. */
export function runFormOf(config: RunConfig, fields: ParameterField[]): RunForm {
  return {
    review_checkpoints: config.review_checkpoints,
    max_steps: textOf(config.max_steps),
    max_cost_usd: textOf(config.max_cost_usd),
    parameters: Object.fromEntries(
      fields.map(({ key }) => [key, textOf(config.parameters?.[key])]),
    ),
  }
}

/** What is wrong with a number typed in a field, given its limits; null when nothing is. */
export function numberProblem(
  text: string,
  field: { integer: boolean; min?: number | undefined; max?: number | undefined },
) {
  const value = Number(text)
  if (!Number.isFinite(value)) return 'Enter a number.'
  if (field.integer && !Number.isInteger(value)) return 'Enter a whole number.'
  if (field.min !== undefined && value < field.min) return `Enter ${String(field.min)} or more.`
  if (field.max !== undefined && value > field.max) return `Enter ${String(field.max)} or less.`
  return null
}

/** The run settings to send; a field that is empty is not set, so the next level supplies it. */
export function toRunConfig(form: RunForm, fields: ParameterField[]): RunConfig {
  const parameters: Record<string, unknown> = {}
  for (const field of fields) {
    const text = (form.parameters[field.key] ?? '').trim()
    if (text === '') continue
    parameters[field.key] =
      field.kind === 'number' ? Number(text) : field.kind === 'boolean' ? text === 'true' : text
  }
  const steps = form.max_steps.trim()
  const cost = form.max_cost_usd.trim()
  return {
    review_checkpoints: form.review_checkpoints,
    max_steps: steps === '' ? null : Number(steps),
    max_cost_usd: cost === '' ? null : Number(cost),
    parameters: Object.keys(parameters).length === 0 ? null : parameters,
  }
}
