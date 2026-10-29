import { z } from 'zod'

import {
  type RunParameterField,
  runParameterProblems,
  runParameterValuesSchema,
} from '@/modules/workflow/entities/@x/run'

/**
 * The fields of the run settings that a form edits, named after the fields of RunDefaults, with
 * their limits. The parameters are checked against the fields of the run parameters of the workflow;
 * a problem sits at `parameters.<name>`.
 */
export function runDefaultsFieldsSchema(parameterFields: RunParameterField[]) {
  return z.object({
    review_checkpoints: z.array(z.string()).nullable(),
    max_steps: z.number().int('Enter a whole number.').min(1, 'Enter 1 or more.').optional(),
    max_cost_usd: z.number().positive('Enter an amount above 0.').optional(),
    parameters: runParameterValuesSchema.superRefine((values, context) => {
      for (const [name, message] of Object.entries(runParameterProblems(parameterFields, values))) {
        context.addIssue({ code: 'custom', message, path: [name] })
      }
    }),
  })
}

/** The values of the fields of the run settings, as a form holds them. */
export type RunDefaultsFieldValues = z.input<ReturnType<typeof runDefaultsFieldsSchema>>
