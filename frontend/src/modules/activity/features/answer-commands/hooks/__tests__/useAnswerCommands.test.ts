import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildMessage } from '@/mocks/messages/messages.fixtures'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { uiCommandIds } from '@/modules/activity/entities'
import type { Run } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'
import { useCommands } from '@/shared/lib/commands'

import { useAnswersStore } from '../../stores/answers.store'
import { useAnswerCommands } from '../useAnswerCommands'

const run: Run = buildRun({
  id: 'answering',
  thread_id: 't1',
  project_id: 'p1',
  number: 1,
  status: 'running',
})
const answer: Message = buildMessage({
  id: 'm2',
  thread_id: 't1',
  sequence: 2,
  created_at: '2026-10-06T08:00:00Z',
  run_id: 'answering',
  author: 'agent',
  commands: [{ command: uiCommandIds.openSettings, artifact_id: null, item_id: null, label: null }],
})

function render(fields: { runs: Run[]; byRun: Map<string | null, Message[]>; isLoaded?: boolean }) {
  const open = vi.fn()
  renderHook(() => {
    useCommands([{ id: uiCommandIds.openSettings, run: open }])
    useAnswerCommands({
      threadId: 't1',
      runs: fields.runs,
      messagesByRun: fields.byRun,
      isLoaded: fields.isLoaded ?? true,
    })
  })
  return open
}

describe('useAnswerCommands', () => {
  afterEach(() => {
    useAnswersStore.setState({ watched: new Map() })
  })

  it('runs the commands of the answer once it has arrived, and stops waiting for it', () => {
    useAnswersStore.getState().watch('answering', 't1')

    const open = render({ runs: [run], byRun: new Map([['answering', [answer]]]) })

    expect(open).toHaveBeenCalledTimes(1)
    expect(useAnswersStore.getState().watched.size).toBe(0)
  })

  it('goes on waiting while the run has no answer', () => {
    useAnswersStore.getState().watch('answering', 't1')

    const open = render({ runs: [run], byRun: new Map() })

    expect(open).not.toHaveBeenCalled()
    expect(useAnswersStore.getState().watched.size).toBe(1)
  })

  it('stops waiting for a run that is gone, as the message went to the work of the project', () => {
    useAnswersStore.getState().watch('answering', 't1')

    const open = render({ runs: [], byRun: new Map() })

    expect(open).not.toHaveBeenCalled()
    expect(useAnswersStore.getState().watched.size).toBe(0)
  })

  it('stops waiting for a run that ended with no answer', () => {
    useAnswersStore.getState().watch('answering', 't1')

    const open = render({ runs: [{ ...run, status: 'succeeded' }], byRun: new Map() })

    expect(open).not.toHaveBeenCalled()
    expect(useAnswersStore.getState().watched.size).toBe(0)
  })

  it('waits before the thread has loaded, when a missing run says nothing yet', () => {
    useAnswersStore.getState().watch('answering', 't1')

    render({ runs: [], byRun: new Map(), isLoaded: false })

    expect(useAnswersStore.getState().watched.size).toBe(1)
  })
})
