import { snakeToSentenceCase } from '@/shared/lib/formatters'
import { isBlank } from '@/shared/lib/guards'

import type { ObjectSchema } from '../definition/workflow-definition.types'
import {
  type RunParameterField,
  type RunParameterProperty,
  runParameterPropertySchema,
  type RunParameterValues,
  type RunParameterWidget,
  runParameterWidgets,
} from './run-parameters.types'

// The run parameters of a workflow, read from `run_parameters_schema`: the widget, label and limits
// of each, and what a form does with their values. The widget comes from the property: the first
// widget of `runParameterWidgets` whose rule shows it; a property of a type that no widget shows (a
// list, an object) is left out. What each widget shows and implies for a value is in
// `runParameterRules`, so no code branches on the name of a widget.

interface RunParameterRule {
  /** Whether the widget shows this property. */
  showsProperty: (property: RunParameterProperty) => boolean
  /** The value the parameter shows while nothing is set, which is left to the next level. */
  unsetValue: () => unknown
  /** What is wrong with a value that is set, in the words of a form; null when it is fine. */
  problem: (field: RunParameterField, value: unknown) => string | null
  /** A value that is set, as the API stores it. */
  toSentValue: (value: unknown) => unknown
}

function numberProblem(field: RunParameterField, value: unknown): string | null {
  const number = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(number)) return 'Enter a number.'
  if (field.integer && !Number.isInteger(number)) return 'Enter a whole number.'
  if (field.minimum !== null && number < field.minimum)
    return `Enter ${String(field.minimum)} or more.`
  if (field.maximum !== null && number > field.maximum)
    return `Enter ${String(field.maximum)} or less.`
  return null
}

function selectProblem(field: RunParameterField, value: unknown): string | null {
  const isOffered = field.options.length === 0 || field.options.includes(String(value))
  return isOffered ? null : 'Choose one of the values.'
}

// Any property that no other widget shows is a text.
const textRule: RunParameterRule = {
  showsProperty: () => true,
  unsetValue: () => '',
  problem: () => null,
  toSentValue: (value) => value,
}

// A flag in the run settings has three states: true, false, and null for a flag left to the next
// level. Only the last one is not sent.
const flagRule: RunParameterRule = {
  showsProperty: ({ type }) => type === 'boolean',
  unsetValue: () => null,
  problem: () => null,
  toSentValue: (value) => value === true,
}

const runParameterRules = {
  text: textRule,
  select: {
    ...textRule,
    showsProperty: ({ enum: options }) => (options?.length ?? 0) > 0,
    problem: selectProblem,
  },
  number: {
    ...textRule,
    showsProperty: ({ type }) => type === 'integer' || type === 'number',
    problem: numberProblem,
    toSentValue: Number,
  },
  boolean: flagRule,
} as const satisfies Record<RunParameterWidget, RunParameterRule>

function widgetOf(property: RunParameterProperty): RunParameterWidget {
  return (
    runParameterWidgets.find((widget) => runParameterRules[widget].showsProperty(property)) ??
    'text'
  )
}

function isShown(type: string | undefined): boolean {
  return type !== 'array' && type !== 'object'
}

/** The run parameters of a workflow, in the order that its schema lists them. */
export function runParameterFields(parameters: ObjectSchema): RunParameterField[] {
  return Object.entries(parameters.properties).flatMap(([name, value]) => {
    const property = runParameterPropertySchema.safeParse(value).data ?? {}
    if (!isShown(property.type)) return []
    const options = property.enum ?? []
    return {
      name,
      label: property.title ?? snakeToSentenceCase(name),
      widget: widgetOf(property),
      description: property.description ?? null,
      options,
      minimum: property.minimum ?? null,
      maximum: property.maximum ?? null,
      integer: property.type === 'integer',
      defaultValue: property.default ?? null,
    }
  })
}

/** The values of the run parameters as a form holds them: those that are stored, else unset. */
export function runParameterValuesOf(
  fields: RunParameterField[],
  stored: RunParameterValues | null,
): RunParameterValues {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      stored?.[field.name] ?? runParameterRules[field.widget].unsetValue(),
    ]),
  )
}

/** The problems of the values of the run parameters, in the words of a form, by parameter name. */
export function runParameterProblems(
  fields: RunParameterField[],
  values: RunParameterValues,
): Record<string, string> {
  const problems: Record<string, string> = {}
  for (const field of fields) {
    const value = values[field.name]
    if (isBlank(value)) continue
    const problem = runParameterRules[field.widget].problem(field, value)
    if (problem !== null) problems[field.name] = problem
  }
  return problems
}

/** The run parameters to send: only those that are set, so that the next level supplies the rest. */
export function sentRunParameters(
  fields: RunParameterField[],
  values: RunParameterValues,
): RunParameterValues {
  return Object.fromEntries(
    fields.flatMap((field) => {
      const value = values[field.name]
      if (isBlank(value)) return []
      return [[field.name, runParameterRules[field.widget].toSentValue(value)]]
    }),
  )
}
