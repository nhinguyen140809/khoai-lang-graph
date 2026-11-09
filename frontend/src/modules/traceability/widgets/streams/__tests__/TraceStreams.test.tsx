import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { useTraceabilityCoverage } from '@/modules/trace/entities'
import { openPage, recordRequests } from '@/test/msw'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'

import { useReloadTraceWhenAgentsStop } from '../useReloadTraceWhenAgentsStop'

const projectId = projectIds.mentor

describe('TraceStreams', () => {
  it('reloads the trace once when the agents stop writing', async () => {
    openPage('/?mock-run-status=running')
    const requests = recordRequests()
    const queryClient = createTestQueryClient()
    renderHookWithProviders(
      () => {
        useReloadTraceWhenAgentsStop(projectId)
        // One query of the trace module, which the reload brings in again.
        return useTraceabilityCoverage(projectId)
      },
      { queryClient },
    )
    await waitFor(() => {
      expect(requests.filter(({ path }) => path.includes('/traceability')).length).toBeGreaterThan(
        0,
      )
    })
    const whileWriting = requests.filter(({ path }) => path.includes('/traceability')).length

    openPage('/')
    // The threads of the project are cached from while the agents wrote; loading them again
    // brings the run that waits, and the stream reloads the trace once.
    await act(async () => {
      await queryClient.invalidateQueries()
    })
    await waitFor(() => {
      const afterStop = requests.filter(({ path }) => path.includes('/traceability')).length
      expect(afterStop).toBeGreaterThan(whileWriting)
    })
  })

  it('reloads nothing while the agents write, and when they never wrote', async () => {
    openPage('/?mock-run-status=running')
    const requests = recordRequests()
    renderHookWithProviders(() => {
      useReloadTraceWhenAgentsStop(projectId)
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })
    expect(requests.filter(({ path }) => path.includes('/trace')).length).toBe(0)

    openPage('/')
    const idle = recordRequests()
    renderHookWithProviders(() => {
      useReloadTraceWhenAgentsStop(projectId)
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })
    expect(idle.filter(({ path }) => path.includes('/trace')).length).toBe(0)
  })
})
