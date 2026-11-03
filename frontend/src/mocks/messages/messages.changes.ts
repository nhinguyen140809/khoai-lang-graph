import type { Run } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'

import { changeProject } from '../projects/projects.lookup'
import { findRun } from '../runs/lookup/runs.lookup'
import { addRun } from '../runs/runs.changes'
import { IdPrefix, mockNow, nextCreatedId } from '../shared/db'
import { changeThread } from '../threads/threads.changes'
import { messagesOfThread } from './messages.lookup'
import { createdMessages } from './messages.store'
import type { MessageToSend } from './messages.types'
import { nameFromMessage } from './messages.utils'

// A message to a thread without an unfinished run starts a run, which goes on until it is stopped.
function startRun(thread: Thread, now: string, toSend: MessageToSend): Run {
  return addRun({
    threadId: thread.id,
    projectId: thread.project_id,
    status: 'running',
    currentStage: 'planning',
    stepCount: 0,
    startedAt: now,
    ...(toSend.runDefaults !== undefined && { override: toSend.runDefaults }),
    ...(toSend.models !== undefined && { models: toSend.models }),
  })
}

// What the first message of a thread names: a thread without a title takes one, and the message
// that starts the first run of a project is its idea, which names it if it has no name.
function nameFromFirstMessage(thread: Thread, message: Message, hasStartedRun: boolean): void {
  if (thread.title === null) {
    changeThread(thread.id, { title: nameFromMessage(message.content) })
  }
  changeProject(thread.project_id, (project) =>
    project.initial_message_id === null && hasStartedRun
      ? {
          initial_message_id: message.id,
          name: project.name ?? nameFromMessage(message.content),
          last_activity_at: message.created_at,
        }
      : { last_activity_at: message.created_at },
  )
}

/**
 * Sends a message of the user to a thread: it waits for the unfinished run of the thread, or
 * starts a run, and the first message of a thread gives its names to the thread and the project.
 */
export function addMessage(thread: Thread, toSend: MessageToSend): { message: Message; run: Run } {
  const now = mockNow()
  const unfinished = thread.active_run_id === null ? undefined : findRun(thread.active_run_id)
  const hasStartedRun = unfinished === undefined
  const run = unfinished ?? startRun(thread, now, toSend)
  const message: Message = {
    id: nextCreatedId(IdPrefix.Message, createdMessages),
    thread_id: thread.id,
    sequence: messagesOfThread(thread.id).length + 1,
    run_id: run.id,
    author: 'user',
    agent_role: null,
    content: toSend.content,
    artifact_refs: [],
    item_refs: [],
    delivery: hasStartedRun ? 'started_run' : 'pending',
    delivered_in_step_id: null,
    created_at: now,
  }
  createdMessages.set([...createdMessages.get(), message])
  nameFromFirstMessage(thread, message, hasStartedRun)
  return { message, run }
}
