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

/** The run settings as the form holds them: text for every number, so an empty field is empty. */
export interface RunForm {
  /** Null when the project leaves the checkpoints to the default of the user. */
  checkpoints: string[] | null
  maxSteps: string
  maxCost: string
  parameters: Record<string, string>
}

/** A number, text or flag as text; anything else, and nothing, as an empty text. */
export function scalarText(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
    ? String(value)
    : ''
}

const textOf = scalarText

export function runFormOf(config: RunConfig): RunForm {
  return {
    checkpoints: config.review_checkpoints,
    maxSteps: textOf(config.max_steps),
    maxCost: textOf(config.max_cost_usd),
    parameters: Object.fromEntries(
      Object.entries(config.parameters ?? {}).map(([key, value]) => [key, textOf(value)]),
    ),
  }
}

function numberProblem(
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

/** The problems of the form by field: `max_steps`, `max_cost_usd` and `parameters.<key>`. */
export function validateRunForm(form: RunForm, fields: ParameterField[]): Record<string, string> {
  const problems: Record<string, string> = {}
  const steps = form.maxSteps.trim()
  if (steps !== '') {
    const problem = numberProblem(steps, { integer: true, min: 1 })
    if (problem !== null) problems.max_steps = problem
  }
  const cost = form.maxCost.trim()
  if (cost !== '') {
    const problem = numberProblem(cost, { integer: false })
    if (problem !== null) problems.max_cost_usd = problem
    else if (Number(cost) <= 0) problems.max_cost_usd = 'Enter an amount above 0.'
  }
  for (const field of fields) {
    const text = (form.parameters[field.key] ?? '').trim()
    if (text === '' || field.kind !== 'number') continue
    const problem = numberProblem(text, { integer: field.integer, min: field.min, max: field.max })
    if (problem !== null) problems[`parameters.${field.key}`] = problem
  }
  return problems
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
  const steps = form.maxSteps.trim()
  const cost = form.maxCost.trim()
  return {
    review_checkpoints: form.checkpoints,
    max_steps: steps === '' ? null : Number(steps),
    max_cost_usd: cost === '' ? null : Number(cost),
    parameters: Object.keys(parameters).length === 0 ? null : parameters,
  }
}
