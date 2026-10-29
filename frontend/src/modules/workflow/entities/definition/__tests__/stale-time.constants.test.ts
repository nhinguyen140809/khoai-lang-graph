import { afterEach, describe, expect, it, vi } from 'vitest'

import { workflowDefinitionStaleTimeCases } from './stale-time.constants.data'

afterEach(() => {
  vi.resetModules()
})

describe('workflowDefinitionStaleTime', () => {
  it.each(workflowDefinitionStaleTimeCases)(
    'is $minutes minutes in a $environment build',
    async ({ environment, staleTime }) => {
      vi.stubEnv('NODE_ENV', environment)
      vi.resetModules()

      const { workflowDefinitionStaleTime } = await import('../stale-time.constants')

      expect(workflowDefinitionStaleTime).toBe(staleTime)
    },
  )
})
