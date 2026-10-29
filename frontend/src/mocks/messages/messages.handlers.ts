import { http } from 'msw'

import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { hasText, isString } from '@/shared/lib/guards'

import { changeProject, findProject } from '../projects/projects.lookup'
import { buildRun, noUsage } from '../runs/fixtures/runs.fixtures'
import { allRuns, findRun } from '../runs/lookup/runs.lookup'
import { createdRuns } from '../runs/runs.store'
import { createdId, IdPrefix, mockNow } from '../shared/db'
import { idempotent, pathParam, readBodyFields } from '../shared/http/request'
import { created, validationFailed } from '../shared/http/response'
import { answerScenario } from '../shared/scenario'
import { allThreads } from '../threads/threads.lookup'
import { threadNotFound } from '../threads/threads.problems'
import { type SentMessage, sentMessages } from './messages.store'

// How many words of its first message name a project created without a name.
const NAME_WORDS = 5

/**
 * The name that the mock gives a project created without one, in place of the agents: the first
 * words of the first line of its first message.
 */
export function nameFromMessage(content: string): string {
  const line = content.split('\n').find(hasText) ?? ''
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
  const run = buildRun({
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
  http.post(
    apiEndpoints.threadMessages.pattern,
    idempotent(async ({ params, request }) => {
      await answerScenario('send-message')
      const thread = allThreads().find(({ id }) => id === pathParam(params, 'threadId'))
      if (thread === undefined) return threadNotFound()
      const { content } = await readBodyFields(request)
      if (!isString(content) || !hasText(content)) {
        return validationFailed([{ field: 'content', message: 'Enter a message.' }])
      }
      const now = mockNow()
      const unfinished = thread.active_run_id === null ? undefined : findRun(thread.active_run_id)
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
      return created({ message, run })
    }),
  ),
]
