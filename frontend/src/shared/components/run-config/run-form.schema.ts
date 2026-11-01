import { z } from 'zod'

import { numberProblem, type ParameterField, type RunForm, toRunConfig } from './run-form.utils'

// A text field that may stay empty, and holds a number within its limits when it is filled.
function numberText(problemOf: (text: string) => string | null) {
  return z.string().superRefine((text, context) => {
    const trimmed = text.trim()
    if (trimmed === '') return
    const problem = problemOf(trimmed)
    if (problem !== null) context.addIssue({ code: 'custom', message: problem })
  })
}

/**
 * The run settings of a form, checked against the limits of each field, for `RunForm` values. Its
 * value is the run settings to send, where an empty field is left to the next level.
 */
export function runFormSchema(fields: ParameterField[]) {
  return z
    .object({
      review_checkpoints: z.array(z.string()).nullable(),
      max_steps: numberText((text) => numberProblem(text, { integer: true, min: 1 })),
      max_cost_usd: numberText(
        (text) =>
          numberProblem(text, { integer: false }) ??
          (Number(text) <= 0 ? 'Enter an amount above 0.' : null),
      ),
      parameters: z.record(z.string(), z.string()).superRefine((values, context) => {
        for (const field of fields) {
          const text = (values[field.key] ?? '').trim()
          if (text === '' || field.kind !== 'number') continue
          const problem = numberProblem(text, field)
          if (problem !== null) {
            context.addIssue({ code: 'custom', message: problem, path: [field.key] })
          }
        }
      }),
    })
    .transform((form: RunForm) => toRunConfig(form, fields))
}
