import { describe, expect, it, vi } from 'vitest'

import { projectIds, threadIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { createTestQueryClient, renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { threadKeys } from '../../keys/threads.keys'
import {
  useProjectThreads,
  useReloadThreadsIfRunStatusChanged,
  useThread,
  useThreads,
} from '../useThreadQueries'
import { reloadCases, threadWith } from './useThreadQueries.data'

describe('useProjectThreads', () => {
  it('loads the threads of a project, the newest message first', async () => {
    const { result } = renderHookWithProviders(() => useProjectThreads(projectIds.mentor))

    await waitForSuccess(result)
    const threads = pageItems(result.current.data)
    expect(threads.map(({ id }) => id)).toEqual([threadIds.mentorMain])
  })
})

describe('useThreads', () => {
  it('loads the threads of the user across projects', async () => {
    const { result } = renderHookWithProviders(() => useThreads())

    await waitForSuccess(result)
    const threads = pageItems(result.current.data)
    expect(threads.map(({ project_id }) => project_id)).toContain(projectIds.mentor)
  })

  it('loads the threads of the user of one project only', async () => {
    const { result } = renderHookWithProviders(() => useThreads({ projectId: projectIds.library }))

    await waitForSuccess(result)
    const threads = pageItems(result.current.data)
    expect(threads.map(({ id }) => id)).toEqual([threadIds.libraryMain])
  })
})

describe('useThread', () => {
  it('loads one thread, with the status of its latest run', async () => {
    const { result } = renderHookWithProviders(() => useThread(threadIds.mentorMain))

    await waitForSuccess(result)
    expect(result.current.data).toMatchObject({
      id: threadIds.mentorMain,
      latest_run_status: 'interrupted',
    })
  })
})

describe('useReloadThreadsIfRunStatusChanged', () => {
  const run = { project_id: 'p1', thread_id: 't1' }

  it.each(reloadCases)(
    'for $name, loads the threads again: $reloads',
    async ({ shown, status, reloads }) => {
      const queryClient = createTestQueryClient()
      queryClient.setQueryData(threadKeys.ofProject('p1'), {
        pages: [{ items: [threadWith('t1', shown)], next_cursor: null }],
        pageParams: [null],
      })
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHookWithProviders(() => useReloadThreadsIfRunStatusChanged(), {
        queryClient,
      })

      await result.current({ ...run, status })

      expect(invalidate).toHaveBeenCalledTimes(reloads ? 1 : 0)
    },
  )

  it('loads nothing when the threads are not loaded', async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHookWithProviders(() => useReloadThreadsIfRunStatusChanged(), {
      queryClient,
    })

    await result.current({ ...run, status: 'running' })

    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useProjectThreads',
      useHook: () => useProjectThreads(projectIds.mentor, { isEnabled: false }),
    },
    { name: 'useThreads', useHook: () => useThreads({}, { isEnabled: false }) },
    { name: 'useThread', useHook: () => useThread(threadIds.mentorMain, { isEnabled: false }) },
  ])
})
