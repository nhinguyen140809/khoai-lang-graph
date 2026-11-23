import { expect } from '@playwright/test'

import { expectCreated, expectOk } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { reviewNodes } from '../../shared/reviews.constants'

const idea = 'A web app where students book study rooms'

interface Answer {
  message: { id: string; run_id: string | null; delivery: string | null }
  run: { id: string; number: number; status: string; workflow_name: string }
  commands: { command: string; artifact_id: string | null; item_id: string | null }[]
}

// The scripted model answers a message about the app as the real one is told to: it reads the
// prompt, asks for the read that the message calls for, answers from what the read brought back and
// names the commands that the question needs. A message about the work goes to the workflow.
test.describe('the assistant that answers a message about the app', () => {
  test('answers a question about an item from a read of it, as a run of its own workflow', async ({
    api,
    client,
  }) => {
    const { projectId, threadId } = await api.startFinishedRun(idea)
    const [specification] = (await api.listArtifacts(projectId)).filter(
      ({ kind }) => kind === 'requirement_specification',
    )
    const [item] = await api.listItems(specification?.id ?? '')

    const answer = expectCreated(
      await client.post<Answer>(`/threads/${threadId}/messages`, {
        content: `What does ${item?.key ?? ''} say?`,
      }),
    )

    expect(answer.run.workflow_name).toBe('assistance')
    expect(answer.run.status).toBe('succeeded')
    const [step] = await api.listSteps(answer.run.id)
    expect(step?.notes.map(({ kind, tool }) => ({ kind, tool }))).toEqual([
      { kind: 'tool', tool: 'read_item' },
    ])
    // What the answer was read from shows under it, as the references of its message.
    const messages = expectOk(
      await client.get<{
        items: { agent_role: string | null; content: string; item_refs: { key: string }[] }[]
      }>(`/threads/${threadId}/messages`),
    ).items
    expect(messages.at(-1)?.agent_role).toBe('assistant')
    // The words of the answer are the last message of the thread, the one of the run that answered.
    expect(messages.at(-1)?.content).toContain(item?.key)
    expect(messages.at(-1)?.item_refs.map(({ key }) => key)).toEqual([item?.key])
  })

  test('names the document to open, and is no run of the work of the thread', async ({
    api,
    client,
  }) => {
    const { projectId, threadId } = await api.startFinishedRun(idea)
    const [specification] = (await api.listArtifacts(projectId)).filter(
      ({ kind }) => kind === 'requirement_specification',
    )

    const answer = expectCreated(
      await client.post<Answer>(`/threads/${threadId}/messages`, {
        content: 'Open the requirement specification',
      }),
    )

    expect(answer.commands).toEqual([
      {
        command: 'open_document',
        artifact_id: specification?.id,
        item_id: null,
        label: expect.any(String),
      },
    ])
    const answered = expectOk(
      await client.get<{ items: { id: string }[] }>(`/threads/${threadId}/runs`, {
        workflow: 'assistance',
      }),
    ).items
    expect(answered.map(({ id }) => id)).toEqual([answer.run.id])
    const thread = expectOk(
      await client.get<{ active_run_id: string | null; latest_run_status: string | null }>(
        `/threads/${threadId}`,
      ),
    )
    expect(thread.active_run_id).toBeNull()
    expect(thread.latest_run_status).toBe('succeeded')
  })

  test('answers while the requirements run waits at a review, and a message about the work waits in that run', async ({
    api,
    client,
  }) => {
    const { threadId, run } = await api.startRun(idea, { reviews: [reviewNodes.personas] })
    await api.waitForReview(run.id)

    const answered = expectCreated(
      await client.post<Answer>(`/threads/${threadId}/messages`, {
        content: 'What is waiting for me?',
      }),
    )
    const pending = expectCreated(
      await client.post<Answer>(`/threads/${threadId}/messages`, {
        content: 'Also ask about group sessions.',
      }),
    )

    expect(answered.run.workflow_name).toBe('assistance')
    expect(answered.commands.map(({ command }) => command)).toEqual(['open_review'])
    expect(pending.run.id).toBe(run.id)
    expect(pending.message.delivery).toBe('pending')
    const thread = expectOk(
      await client.get<{ active_run_id: string | null; latest_run_status: string | null }>(
        `/threads/${threadId}`,
      ),
    )
    expect(thread.active_run_id).toBe(run.id)
    expect(thread.latest_run_status).toBe('interrupted')
  })
})
