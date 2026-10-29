import { type RunDefaults, runDefaultsSchema, type RunStep } from '@/modules/run/entities'
import type { FieldProblem } from '@/shared/api/error'
import { isRecord } from '@/shared/lib/guards'

import { choice, choiceProblem, schemaProblems } from '../shared/http/validation'
import { stepsOfRun } from './lookup/runs.lookup'

// What the bodies of the requests about runs may hold: the step that a retry starts from, and the
// run settings that a project or a message gives.

// The run settings as a request gives them: each field of its type, or null for the value of the
// next level, and no other field. A field may be left out.
const runDefaultsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    review_checkpoints: { type: ['array', 'null'], items: { type: 'string' } },
    max_steps: { type: ['integer', 'null'] },
    max_cost_usd: { type: ['number', 'null'] },
    parameters: { type: ['object', 'null'] },
  },
}

// A field left out of the run settings is not set.
const noRunDefaults: RunDefaults = {
  review_checkpoints: null,
  max_steps: null,
  max_cost_usd: null,
  parameters: null,
}

/** The step to start from, one of the steps of the run that is retried; else the problems. */
export function validateRetryBody(
  runId: string,
  given: Record<string, unknown>,
): { step: RunStep } | { problems: FieldProblem[] } {
  const steps = stepsOfRun(runId)
  const stepId = choice(
    steps.map(({ id }) => id),
    given.from_step_id,
  )
  const step = steps.find(({ id }) => id === stepId)
  return step === undefined ? { problems: [choiceProblem('from_step_id')] } : { step }
}

/** The run settings that a body gives at `run_config`, a field left out not set; else the problems. */
export function validateRunDefaults(
  given: unknown,
): { runDefaults: RunDefaults } | { problems: FieldProblem[] } {
  const problems = schemaProblems(runDefaultsJsonSchema, given, 'run_config')
  if (problems.length > 0 || !isRecord(given)) return { problems }
  return { runDefaults: runDefaultsSchema.parse({ ...noRunDefaults, ...given }) }
}
