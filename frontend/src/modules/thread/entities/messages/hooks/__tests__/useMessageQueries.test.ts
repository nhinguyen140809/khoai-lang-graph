import { describe, expect, it } from 'vitest'

import { threadIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useThreadMessages } from '../useMessageQueries'

describe('useThreadMessages', () => {
  it('loads the messages of a thread in the order they were sent', async () => {
    const { result } = renderHookWithProviders(() => useThreadMessages(threadIds.mentorMain))

    await waitForSuccess(result)
    const messages = pageItems(result.current.data)
    expect(messages.map(({ sequence }) => sequence)).toEqual([1, 2, 3, 4])
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
