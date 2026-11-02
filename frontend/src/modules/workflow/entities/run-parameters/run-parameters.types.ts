import { z } from 'zod'

// The run parameters of a workflow: the settings that its definition names in
// `run_parameters_schema`, which a project or a user may set before a run starts. They are flat
// values with a type of their own, so they have their own field type, apart from the fields of the
// content of an artifact.

/**
 * The control for one run parameter, in the order in which a property is given one: the first
 * widget that can show the property shows it, so `text`, which can show any, comes last.
 */
export const runParameterWidgets = ['select', 'number', 'boolean', 'text'] as const

export type RunParameterWidget = (typeof runParameterWidgets)[number]

/** One run parameter, built from one property of `run_parameters_schema`: what a form needs to show and check it. */
export interface RunParameterField {
  name: string
  /** The title of the property; when it has none, derived from the name: `max_turns` reads "Max turns". */
  title: string
  widget: RunParameterWidget
  description: string | null
  /** The values of a select; empty for the other widgets. */
  options: string[]
  minimum: number | null
  maximum: number | null
  /** The type of the property is `integer`: a number with no fraction. */
  integer: boolean
  /** The `default` of the property, the value a run takes when no level sets one; null without one. */
  defaultValue: unknown
}

/** The keywords of a property of `run_parameters_schema` that the app reads. */
export const runParameterPropertySchema = z.looseObject({
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.unknown().optional(),
})

export type RunParameterProperty = z.infer<typeof runParameterPropertySchema>

/** The values of the run parameters, by the name of the parameter. */
export const runParameterValuesSchema = z.record(z.string(), z.unknown())

export type RunParameterValues = z.infer<typeof runParameterValuesSchema>
