import { act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { runIds } from '@/mocks/shared/db'
import { openedEventSources } from '@/test/event-source'
import { renderHookWithProviders } from '@/test/render'

import { listenToRun } from '../../run-event-channels.api'
import { useRunProgressEvents } from '../useRunProgressEvents'

// The events of the stream of a run, with the fields the API carries.
const NODE_START = {
  node: 'analyst',
  step_id: 's66',
  agent_role: 'analyst',
  stage: 'analysis',
  iteration: 0,
  persona_key: null,
}
const NODE_END = {
  node: 'analyst',
  step_id: 's66',
  status: 'succeeded',
  usage: {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
    cost_usd: 0,
    duration_ms: 0,
  },
}
const TOKEN = { node: 'analyst', text: 'Hello', step_id: 's66' }
const MESSAGE_DELIVERED = { message_id: 'm1', step_id: 's66', node: 'analyst' }
const DONE = { status: 'succeeded' }

function useFollowed(onChanged: () => void) {
  useRunProgressEvents(
    buildRun({
      id: runIds.mentorMain3,
      thread_id: 't1',
      project_id: 'p1',
      number: 3,
      status: 'running',
      last_event_id: 246,
    }),
    onChanged,
  )
}

async function followed(onChanged: () => void) {
  const hook = renderHookWithProviders(() => {
    useFollowed(onChanged)
  })
  await waitFor(() => {
    expect(openedEventSources()).toHaveLength(1)
  })
  return { ...hook, source: openedEventSources()[0] }
}

describe('useRunProgressEvents', () => {
  it('calls after each event that changes what the run did', async () => {
    const onChanged = vi.fn()
    const { source } = await followed(onChanged)

    act(() => {
      source?.emit('node_start', NODE_START, '247')
    })
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
  })

  it('calls after a message is taken in, not after a token', async () => {
    const onChanged = vi.fn()
    const { source } = await followed(onChanged)

    act(() => {
      source?.emit('token', TOKEN, '247')
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(onChanged).not.toHaveBeenCalled()

    act(() => {
      source?.emit('message_delivered', MESSAGE_DELIVERED, '248')
    })
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
  })

  it('leaves out the events up to the last event the run had when it loaded', async () => {
    // A listener keeps the channel of the run open, with the events 246 and 247 stored in it.
    const keep = listenToRun(runIds.mentorMain3, () => undefined)
    await waitFor(() => {
      expect(openedEventSources()).toHaveLength(1)
    })
    act(() => {
      const source = openedEventSources()[0]
      source?.emit('node_start', NODE_START, '246')
      source?.emit('node_end', NODE_END, '247')
    })

    const onChanged = vi.fn()
    renderHookWithProviders(() => {
      useFollowed(onChanged)
    })

    // Only the event after the one the run loaded with calls back.
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
    keep()
  })

  it('calls nothing for a finished run', async () => {
    const onChanged = vi.fn()
    renderHookWithProviders(() => {
      useRunProgressEvents(
        buildRun({
          id: runIds.mentorMain3,
          thread_id: 't1',
          project_id: 'p1',
          number: 3,
          status: 'succeeded',
        }),
        onChanged,
      )
    })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(openedEventSources()).toHaveLength(0)
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('stops after done', async () => {
    const onChanged = vi.fn()
    const { source } = await followed(onChanged)

    act(() => {
      source?.emit('done', DONE, '247')
    })
    await waitFor(() => {
      expect(source?.closed).toBe(true)
    })
  })
})
