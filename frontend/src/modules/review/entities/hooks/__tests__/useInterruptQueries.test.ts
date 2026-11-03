import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { usePendingInterrupt, useRunInterrupts } from '../useInterruptQueries'

describe('useRunInterrupts', () => {
  it('loads the interrupts of a run with their statuses', async () => {
    const { result } = renderHookWithProviders(() => useRunInterrupts(runIds.mentorMain3))

    await waitForSuccess(result)
    const interrupts = pageItems(result.current.data)
    expect(interrupts.map(({ node, status }) => ({ node, status }))).toEqual([
      { node: 'checkpoint_personas', status: 'resolved' },
      { node: 'checkpoint_analysis', status: 'pending' },
    ])
  })
})

describe('usePendingInterrupt', () => {
  it('loads the review that an interrupted run waits for', async () => {
    const { result } = renderHookWithProviders(() =>
      usePendingInterrupt(runIds.mentorMain3, { runStatus: 'interrupted' }),
    )

    await waitForSuccess(result)
    expect(result.current.data).toMatchObject({
      node: 'checkpoint_analysis',
      status: 'pending',
    })
  })

  it('loads null for a run that waits for nothing', async () => {
    const { result } = renderHookWithProviders(() =>
      usePendingInterrupt(runIds.mentorMain1, { runStatus: 'interrupted' }),
    )

    await waitForSuccess(result)
    expect(result.current.data).toBeNull()
  })
})

describe('usePendingInterrupt once the run goes on', () => {
  it('gives nothing, though the review is still in the cache', async () => {
    const { result, rerender } = renderHookWithProviders(
      ({ status }: { status: 'interrupted' | 'running' }) =>
        usePendingInterrupt(runIds.mentorMain3, { runStatus: status }),
      { initialProps: { status: 'interrupted' } },
    )
    await waitForSuccess(result)
    expect(result.current.data).toMatchObject({ status: 'pending' })

    rerender({ status: 'running' })

    expect(result.current.data).toBeUndefined()
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useRunInterrupts',
      useHook: () => useRunInterrupts(runIds.mentorMain3, { isEnabled: false }),
    },
    {
      name: 'usePendingInterrupt while the run runs',
      useHook: () => usePendingInterrupt(runIds.mentorMain3, { runStatus: 'running' }),
    },
    {
      name: 'usePendingInterrupt without the status of the run',
      useHook: () => usePendingInterrupt(runIds.mentorMain3, { runStatus: undefined }),
    },
  ])
})
