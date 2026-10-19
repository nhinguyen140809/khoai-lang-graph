import { describe, expect, it } from 'vitest'

import { readCases } from './workflow.api.data'

describe('the workflow API', () => {
  it.each(readCases)('reads $name', async ({ read, expected }) => {
    await expect(read()).resolves.toEqual(expected)
  })
})
