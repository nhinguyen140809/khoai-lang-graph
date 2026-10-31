import { describe, expect, it } from 'vitest'

import { validateUserSettingsBody } from '../user-settings.validators'
import { acceptedSettingsBodies, refusedSettingsBodies } from './user-settings.validators.data'

describe('validateUserSettingsBody', () => {
  it.each(acceptedSettingsBodies)('takes $name', ({ body }) => {
    expect(validateUserSettingsBody(body)).toEqual({ fields: body })
  })

  it.each(refusedSettingsBodies)('refuses $name', ({ body, problems }) => {
    expect(validateUserSettingsBody(body)).toEqual({ problems })
  })

  it('gives the fields of the run settings that are left out as null', () => {
    expect(validateUserSettingsBody({ default_run_config: { max_steps: 10 } })).toEqual({
      fields: {
        default_run_config: {
          review_checkpoints: null,
          max_steps: 10,
          max_cost_usd: null,
          parameters: null,
        },
      },
    })
  })
})
