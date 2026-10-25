import { describe, expect, it } from 'vitest'

import { envSchema } from '../env.types'
import { invalidEnvCases, validEnvCases } from './env.types.data'

describe('envSchema', () => {
  it.each(validEnvCases)('accepts $name', ({ values }) => {
    expect(envSchema.safeParse(values).success).toBe(true)
  })

  it.each(invalidEnvCases)('rejects $name', ({ values }) => {
    expect(envSchema.safeParse(values).success).toBe(false)
  })
})
