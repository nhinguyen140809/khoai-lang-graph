import { http, HttpResponse } from 'msw'

import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { changeProject, findProject } from '../projects/projects.handlers'
import { createdRuns } from '../runs/mock-runs.store'
import { buildMockRun, noUsage } from '../runs/runs.fixtures'
import { allRuns, findMockRun } from '../runs/runs.handlers'
import { mockRecord } from '../shared/mock-db.utils'
import { createdId, IdPrefix } from '../shared/mock-ids.constants'
import { answerScenario } from '../shared/mock-scenario.utils'
import { notFound, validationFailed } from '../shared/problem.utils'
import { readBodyFields } from '../shared/request-body.utils'
import { allThreads } from '../threads/threads.handlers'

/**
 * A message as POST /threads/{thread_id}/messages answers it, since the threads feature has no type
 * of a message yet.
 */
export interface SentMessage {
  id: string
  thread_id: string
  /** Order of the message in its thread, from 1, without gaps. */
  sequence: number
  /** The run that the message started or belongs to. */
  run_id: string | null
  author: 'user' | 'agent' | 'system'
  agent_role: string | null
  content: string
  artifact_refs: { artifact_id: string; kind: string; title: string; version: number }[]
  item_refs: { item_id: string; kind: string; key: string; version: number }[]
  delivery: 'started_run' | 'pending' | 'delivered' | 'undelivered' | null
  delivered_in_step_id: string | null
  created_at: string
}

// Messages sent with POST /threads/{thread_id}/messages.
const sentMessages = mockRecord<SentMessage[]>('sent-messages', () => [])

// How many words of its first message name a project created without a name.
const NAME_WORDS = 5

/**
 * The name that the mock gives a project created without one, in place of the agents: the first
 * words of the first line of its first message.
 */
export function nameFromMessage(content: string): string {
  const line = content.split('\n').find((text) => text.trim() !== '') ?? ''
  return line
    .trim()
    .split(/\s+/)
    .slice(0, NAME_WORDS)
    .join(' ')
    .replace(/[.,;:!?]+$/, '')
}

// A message to a thread without an unfinished run starts a run, which goes on until it is stopped.
function startRun(thread: Thread, now: string): Run {
  const runs = createdRuns.get()
  const run = buildMockRun({
    id: createdId(IdPrefix.Run, runs.length + 1),
    thread_id: thread.id,
    project_id: thread.project_id,
    number: allRuns().filter(({ thread_id }) => thread_id === thread.id).length + 1,
    status: 'running',
    current_stage: 'planning',
    usage: noUsage,
    step_count: 0,
    last_event_id: 0,
    started_at: now,
    finished_at: null,
  })
  const language = findProject(thread.project_id)?.output_language ?? 'en'
  const started = { ...run, run_config: { ...run.run_config, output_language: language } }
  createdRuns.set([...runs, started])
  return started
}

export const messageHandlers = [
  http.post('/api/v1/threads/:threadId/messages', async ({ params, request }) => {
    await answerScenario('send-message')
    const thread = allThreads().find(({ id }) => id === String(params.threadId))
    if (thread === undefined) return notFound('The thread')
    const { content } = await readBodyFields(request)
    if (typeof content !== 'string' || content.trim() === '') {
      return validationFailed([{ field: 'content', message: 'Enter a message.' }])
    }
    const now = new Date().toISOString()
    const unfinished = thread.active_run_id === null ? undefined : findMockRun(thread.active_run_id)
    const run = unfinished ?? startRun(thread, now)
    const messages = sentMessages.get()
    const message: SentMessage = {
      id: createdId(IdPrefix.Message, messages.length + 1),
      thread_id: thread.id,
      sequence: messages.filter(({ thread_id }) => thread_id === thread.id).length + 1,
      run_id: run.id,
      author: 'user',
      agent_role: null,
      content,
      artifact_refs: [],
      item_refs: [],
      delivery: unfinished === undefined ? 'started_run' : 'pending',
      delivered_in_step_id: null,
      created_at: now,
    }
    sentMessages.set([...messages, message])
    // The message that starts the first run of a project is its idea, which names it if it has
    // no name.
    changeProject(thread.project_id, (project) =>
      project.initial_message_id === null && unfinished === undefined
        ? {
            initial_message_id: message.id,
            name: project.name ?? nameFromMessage(content),
            last_activity_at: now,
          }
        : { last_activity_at: now },
    )
    return HttpResponse.json({ message, run }, { status: 201 })
  }),
]
