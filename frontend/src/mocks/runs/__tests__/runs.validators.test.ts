import { describe, expect, it } from 'vitest'

import { runIds } from '../../shared/db'
import { validateRetryBody, validateRunDefaults } from '../runs.validators'
import {
  acceptedRunDefaults,
  firstStepId,
  refusedBodies,
  refusedRunDefaults,
} from './runs.validators.data'

describe('validateRetryBody', () => {
  it('takes a step of the run', () => {
    const checked = validateRetryBody(runIds.mentorMain2, { from_step_id: firstStepId })

    expect(checked).toMatchObject({ step: { id: firstStepId } })
  })

  it.each(refusedBodies)('refuses $name', ({ body }) => {
    expect(validateRetryBody(runIds.mentorMain2, body)).toEqual({
      problems: [{ field: 'from_step_id', message: 'Choose one of the values.' }],
    })
  })
})

describe('validateRunDefaults', () => {
  it.each(acceptedRunDefaults)('takes $name', ({ given, runDefaults }) => {
    expect(validateRunDefaults(given)).toEqual({ runDefaults })
  })

  it.each(refusedRunDefaults)('refuses $name', ({ given, problems }) => {
    expect(validateRunDefaults(given)).toEqual({ problems })
  })

  it('names its problems under the field that it is given', () => {
    expect(validateRunDefaults({ max_steps: 'many' }, 'default_run_config')).toEqual({
      problems: [
        {
          field: 'default_run_config.max_steps',
          message: 'Send a value of type integer or null.',
        },
      ],
    })
  })
})
