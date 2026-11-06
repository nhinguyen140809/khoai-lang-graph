import { describe, expect, it } from 'vitest'

import { threadIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useReloadThreadMessages, useThreadMessages } from '../useMessageQueries'

describe('useThreadMessages', () => {
  it('loads the messages of a thread in the order they were sent', async () => {
    const { result } = renderHookWithProviders(() => useThreadMessages(threadIds.mentorMain))

    await waitForSuccess(result)
    const messages = pageItems(result.current.data)
    expect(messages.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('useReloadThreadMessages', () => {
  it('loads the messages of a thread again', async () => {
    const first = renderHookWithProviders(() => useThreadMessages(threadIds.mentorMain))
    await waitForSuccess(first.result)
    // A sent message that the reload brings.
    const reload = renderHookWithProviders(() => useReloadThreadMessages()).result.current

    await reload(threadIds.mentorMain)
    await waitForSuccess(first.result)

    const messages = pageItems(first.result.current.data)
    expect(messages.length).toBeGreaterThan(0)
    first.unmount()
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useThreadMessages',
      useHook: () => useThreadMessages(threadIds.mentorMain, { isEnabled: false }),
    },
  ])
})
