import { runIds } from '../../shared/db'
import { runStepFixtures } from '../fixtures/runs.fixtures'

const [firstStep] = runStepFixtures(runIds.mentorMain2, 'done')

/** The id of the first step of run 2 of the mentor thread. */
export const firstStepId = firstStep?.id ?? ''

/** A body that does not name a step of the run. */
export const refusedBodies = [
  { name: 'no step', body: {} },
  { name: 'a step that the run does not have', body: { from_step_id: 'no-such-step' } },
  { name: 'a step that is not a text', body: { from_step_id: 3 } },
]

/** Run settings that a request gives, and the settings that they set: a field left out is not set. */
export const acceptedRunDefaults = [
  {
    name: 'every field',
    given: {
      review_checkpoints: [],
      max_steps: 40,
      max_cost_usd: 1.5,
      parameters: { max_turns: 4 },
    },
    runDefaults: {
      review_checkpoints: [],
      max_steps: 40,
      max_cost_usd: 1.5,
      parameters: { max_turns: 4 },
    },
  },
  {
    name: 'one field',
    given: { max_steps: 40 },
    runDefaults: { review_checkpoints: null, max_steps: 40, max_cost_usd: null, parameters: null },
  },
]

/** Run settings that a request gives, and the problems that the mock finds in them. */
export const refusedRunDefaults = [
  {
    name: 'a field of the wrong type',
    given: { max_steps: 'five' },
    problems: [{ field: 'run_config.max_steps', message: 'Send a value of type integer or null.' }],
  },
  {
    name: 'a review that is not text',
    given: { review_checkpoints: [3] },
    problems: [
      { field: 'run_config.review_checkpoints.0', message: 'Send a value of type string.' },
    ],
  },
  {
    name: 'a field that the settings do not have',
    given: { models: {} },
    problems: [{ field: 'run_config.models', message: 'This field is not allowed.' }],
  },
  {
    name: 'a value that is not an object',
    given: 'all',
    problems: [{ field: 'run_config', message: 'Send a value of type object.' }],
  },
]
