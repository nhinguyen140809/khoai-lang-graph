import { act, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { useRunInterrupts } from '@/modules/review/entities/@x/activity'
import { useRunSteps } from '@/modules/run/entities/@x/activity'
import { useThreadMessages } from '@/modules/thread/entities/@x/activity'
import { openedEventSources } from '@/test/event-source'
import { recordRequests } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useActivityStream } from '../useActivityStream'

// Run 3 of the mentor thread, running: its stream stays open.
const running = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 3,
  status: 'running',
  current_stage: 'analysis',
  last_event_id: 246,
})

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
const TOKEN = { node: 'analyst', text: 'Hi', step_id: 's66' }

/** How many of the recorded requests the activity loaded again: the steps, the interrupts, the messages. */
function activityLoads(requests: { path: string }[]): number {
  return requests.filter(({ path }) =>
    ['/steps', '/interrupts', '/messages'].some((part) => path.includes(part)),
  ).length
}

describe('useActivityStream', () => {
  it('loads the work, the reviews and the messages again at an event that changes what the run did', async () => {
    const requests = recordRequests()
    const followed = await follow(running)
    const before = activityLoads(requests)

    act(() => {
      followed.source?.emit('node_end', NODE_END, '247')
    })
    await waitFor(() => {
      expect(activityLoads(requests)).toBeGreaterThan(before)
    })
  })

  it('loads nothing at an event that changes none of the three', async () => {
    const requests = recordRequests()
    const followed = await follow(running)
    const before = activityLoads(requests)

    act(() => {
      followed.source?.emit('token', TOKEN, '247')
    })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(activityLoads(requests)).toBe(before)
  })

  it('follows nothing without a run', async () => {
    await follow(null)

    expect(openedEventSources()).toHaveLength(0)
  })
})

async function follow(run: Parameters<typeof useActivityStream>[0]) {
  const hook = renderHookWithProviders(() => {
    // The queries the stream loads again, as the activity page reads them.
    useRunSteps(run?.id ?? '', { runStatus: run?.status })
    useRunInterrupts(run?.id ?? '', { runStatus: run?.status })
    useThreadMessages(threadIds.mentorMain, { runStatus: run?.status })
    useActivityStream(run, threadIds.mentorMain)
  })
  await waitFor(() => {
    expect(openedEventSources()).toHaveLength(run === null ? 0 : 1)
  })
  return { ...hook, source: openedEventSources()[0] }
}
