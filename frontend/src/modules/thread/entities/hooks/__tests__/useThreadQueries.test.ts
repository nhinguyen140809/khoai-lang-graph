import { describe, expect, it } from 'vitest'

import { projectIds, threadIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useProjectThreads, useThread, useThreads } from '../useThreadQueries'

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
