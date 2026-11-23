import { describe, expect, it } from 'vitest'

import {
  assistanceAgentFixture,
  assistanceDefinitionFixture,
} from '@/mocks/workflow/workflow.fixtures'
import type { Thread } from '@/modules/thread/entities'
import { assertPresent } from '@/shared/lib/guards'

import { allArtifacts } from '../../artifacts/artifacts.lookup'
import { projectIds, threadIds } from '../../shared/db'
import { buildThread } from '../../threads/threads.fixtures'
import { findThread } from '../../threads/threads.lookup'
import { createdThreads } from '../../threads/threads.store'
import { addMessage } from '../messages.changes'
import { messagesOfThread } from '../messages.lookup'

describe('addMessage', () => {
  it('numbers a message after the messages of the thread', () => {
    const thread = assertPresent(
      findThread(threadIds.mentorMain),
      'The mock data holds the mentor thread.',
    )

    const { message } = addMessage(thread, { content: 'Another question.' })

    expect(message).toMatchObject({ sequence: 7, delivery: 'pending' })
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

  it('answers a message about the settings with a finished run of the assistant', () => {
    const thread = assertPresent(
      findThread(threadIds.laundryMain),
      'The mock data holds the laundry thread.',
    )

    const { message, run, commands } = addMessage(thread, { content: 'Where are the limits?' })

    expect(run).toMatchObject({
      workflow_name: assistanceDefinitionFixture.name,
      status: 'succeeded',
    })
    expect(commands).toMatchObject([{ command: 'open_settings' }])
    expect(message).toMatchObject({ author: 'user', run_id: run.id, delivery: null })
    const answer = messagesOfThread(thread.id).at(-1)
    expect(answer).toMatchObject({
      author: 'agent',
      agent_role: assistanceAgentFixture.agent_role,
      run_id: run.id,
    })
    expect(answer?.content).toContain('limits')
  })

  it('names the document that an answer opens in the references of the answer', () => {
    const thread = assertPresent(
      findThread(threadIds.laundryMain),
      'The mock data holds the laundry thread.',
    )
    const artifact = assertPresent(
      allArtifacts().find(({ project_id: owner }) => owner === thread.project_id),
      'The mock data holds a document of the laundry project.',
    )

    const { commands } = addMessage(thread, { content: `Open ${artifact.title}` })

    expect(commands).toMatchObject([{ command: 'open_document', artifact_id: artifact.id }])
    expect(messagesOfThread(thread.id).at(-1)?.artifact_refs).toMatchObject([
      { artifact_id: artifact.id, title: artifact.title },
    ])
  })
})
