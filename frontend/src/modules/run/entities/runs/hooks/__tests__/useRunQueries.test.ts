import { describe, expect, it } from 'vitest'

import { runIds, threadIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useLatestRun, useRun, useThreadRuns } from '../useRunQueries'

describe('useThreadRuns', () => {
  it('loads the runs of a thread, the newest first', async () => {
    const { result } = renderHookWithProviders(() => useThreadRuns(threadIds.mentorMain))

    await waitForSuccess(result)
    const runs = pageItems(result.current.data)
    expect(runs.map(({ number }) => number)).toEqual([3, 2, 1])
  })
})

describe('useLatestRun', () => {
  it('loads the newest run of a thread', async () => {
    const { result } = renderHookWithProviders(() => useLatestRun(threadIds.mentorMain))

    await waitForSuccess(result)
    expect(result.current.data?.id).toBe(runIds.mentorMain3)
  })
})

describe('useRun', () => {
  it('loads one run', async () => {
    const { result } = renderHookWithProviders(() => useRun(runIds.mentorMain2))

    await waitForSuccess(result)
    expect(result.current.data).toMatchObject({ number: 2, status: 'failed' })
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useThreadRuns',
      useHook: () => useThreadRuns(threadIds.mentorMain, { isEnabled: false }),
    },
    {
      name: 'useLatestRun',
      useHook: () => useLatestRun(threadIds.mentorMain, { isEnabled: false }),
    },
    { name: 'useRun', useHook: () => useRun(runIds.mentorMain2, { isEnabled: false }) },
  ])
})
