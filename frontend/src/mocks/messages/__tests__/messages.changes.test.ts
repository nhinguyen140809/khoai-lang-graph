import { describe, expect, it } from 'vitest'

import type { Thread } from '@/modules/thread/entities'
import { assertPresent } from '@/shared/lib/guards'

import { projectIds, threadIds } from '../../shared/db'
import { buildThread } from '../../threads/threads.fixtures'
import { findThread } from '../../threads/threads.lookup'
import { createdThreads } from '../../threads/threads.store'
import { addMessage } from '../messages.changes'

describe('addMessage', () => {
  it('numbers a message after the messages of the thread', () => {
    const thread = assertPresent(
      findThread(threadIds.mentorMain),
      'The mock data holds the mentor thread.',
    )

    const { message } = addMessage(thread, { content: 'Another question.' })

    expect(message).toMatchObject({ sequence: 5, delivery: 'pending' })
  })

  it('starts a run for a thread whose run has ended, with the models of the message', () => {
    const thread = assertPresent(
      findThread(threadIds.laundryMain),
      'The mock data holds the laundry thread.',
    )

    const { message, run } = addMessage(thread, {
      content: 'Another wash.',
      models: { analyst: 'openai:gpt-4.1' },
    })

    expect(message).toMatchObject({ delivery: 'started_run', run_id: run.id })
    expect(run).toMatchObject({ number: 2 })
    expect(run.run_config.models).toMatchObject({ analyst: 'openai:gpt-4.1' })
  })

  it('names a thread without a title from its first message', () => {
    const thread: Thread = buildThread({
      id: 't-of-test',
      project_id: projectIds.laundry,
      title: null,
    })
    createdThreads.set([thread])

    addMessage(thread, { content: 'Thesis tracker\nFor the supervisors of a faculty.' })

    expect(findThread('t-of-test')).toMatchObject({ title: 'Thesis tracker' })
  })
})
