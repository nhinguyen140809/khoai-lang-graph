import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import { type RunStatus, useLatestRun } from '@/modules/run/entities/@x/project'
import { useProjectThreads } from '@/modules/thread/entities/@x/project'
import { apiEndpoints } from '@/shared/api/endpoints'
import { sleep } from '@/shared/lib/scheduling'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'

import { useProjectRunStream } from '../useProjectRunStream'

// The latest run of the mentor thread and the threads of its project, as a screen reads them,
// while the stream of the run is followed.
function useFollowedStatus() {
  useProjectThreads(projectIds.mentor)
  const run = useLatestRun(threadIds.mentorMain)
  useProjectRunStream(run.data)
}

describe('useProjectRunStream', () => {
  it('loads the threads again only when the status of the run changes', async () => {
    // The mentor thread and its run 3, which waits for a review, as the API answers them now.
    let status: RunStatus = 'interrupted'
    let runLoads = 0
    let threadLoads = 0
    server.use(
      http.get(apiEndpoints.threadRuns.pattern, () => {
        runLoads += 1
        return HttpResponse.json({
          items: [
            buildRun({
              id: runIds.mentorMain3,
              thread_id: threadIds.mentorMain,
              project_id: projectIds.mentor,
              number: 3,
              status,
            }),
          ],
          next_cursor: null,
        })
      }),
      http.get(apiEndpoints.projectThreads.pattern, () => {
        threadLoads += 1
        return HttpResponse.json({
          items: [
            buildThread({
              id: threadIds.mentorMain,
              project_id: projectIds.mentor,
              latest_run_status: status,
            }),
          ],
          next_cursor: null,
        })
      }),
    )
    renderHookWithProviders(useFollowedStatus)
    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(1)
      expect(threadLoads).toBe(1)
    })
    const source = openedEventSources()[0]
    const loadsBefore = runLoads

    // A step that ends leaves the run waiting, as its thread already shows.
    act(() => {
      source?.emit('node_end', { node: 'analyst' }, '247')
    })
    await waitFor(() => {
      expect(runLoads).toBe(loadsBefore + 1)
    })
    await sleep(50)
    expect(threadLoads).toBe(1)

    // The end of the run changes its status, which its thread shows only once it loads again.
    status = 'succeeded'
    act(() => {
      source?.emit('done', { status: 'succeeded' }, '248')
    })
    await waitFor(() => {
      expect(threadLoads).toBe(2)
    })
  })
})
