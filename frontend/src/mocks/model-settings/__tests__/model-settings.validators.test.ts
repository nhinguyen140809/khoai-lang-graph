import { describe, expect, it } from 'vitest'

import { validateModelSettings } from '../model-settings.validators'
import { choiceCases, problemCases } from './model-settings.validators.data'

describe('validateModelSettings', () => {
  it.each(choiceCases)('reads $name', ({ body, choices }) => {
    expect(validateModelSettings(body)).toEqual({ choices })
  })

  it.each(problemCases)('refuses $name', ({ body, problems }) => {
    expect(validateModelSettings(body)).toEqual({ problems })
  })
})
