import { describe, expect, it } from 'vitest'

import type { ChatLoad } from '../chat-state.types'
import { chatStateOf } from '../chat-state.utils'

const loaded: ChatLoad = { hasThread: true, isPending: false, isError: false, hasActivity: true }

describe('chatStateOf', () => {
  it.each([
    { name: 'is ready with a thread that has activity', load: loaded, state: 'ready' },
    {
      name: 'is empty without a thread, whatever else',
      load: { ...loaded, hasThread: false, isPending: true },
      state: 'empty',
    },
    {
      name: 'is empty when nothing was said',
      load: { ...loaded, hasActivity: false },
      state: 'empty',
    },
    {
      name: 'is pending while the thread loads',
      load: { ...loaded, isPending: true },
      state: 'pending',
    },
    { name: 'is an error when a load fails', load: { ...loaded, isError: true }, state: 'error' },
    {
      name: 'shows the load, not the empty chat, while it runs',
      load: { ...loaded, isPending: true, hasActivity: false },
      state: 'pending',
    },
  ] as const)('$name', ({ load, state }) => {
    expect(chatStateOf(load)).toBe(state)
  })
})
