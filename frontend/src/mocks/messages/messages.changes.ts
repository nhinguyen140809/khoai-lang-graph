import type { Run, StepNote } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'

import { findArtifact } from '../artifacts/artifacts.lookup'
import { changeProject } from '../projects/projects.lookup'
import { findRun } from '../runs/lookup/runs.lookup'
import { addRun, endAnsweringRun, startAnsweringRun } from '../runs/runs.changes'
import { IdPrefix, mockNow, nextCreatedId } from '../shared/db'
import { changeThread } from '../threads/threads.changes'
import { findThread } from '../threads/threads.lookup'
import { assistanceAgentFixture, assistanceToolFixture } from '../workflow/workflow.fixtures'
import { assistantAnswerOf } from './message-assistant.utils'
import { messagesOfThread } from './messages.lookup'
import { createdMessages, pendingAnswers } from './messages.store'
import type { MessageToSend, MockAnswer } from './messages.types'
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

// The documents that an answer was read from, which the API names in the references of the answer:
// here, the ones that its commands open.
function readDocumentsOf(reply: MockAnswer): Message['artifact_refs'] {
  return reply.commands.flatMap(({ artifact_id: artifactId }) => {
    const artifact = artifactId === null ? undefined : findArtifact(artifactId)
    return artifact === undefined
      ? []
      : [
          {
            artifact_id: artifact.id,
            kind: artifact.kind,
            title: artifact.title,
            version: artifact.version,
          },
        ]
  })
}

// The tool that the mock assistant reads with before it opens a document, as the definition names it:
// one that shows to the user, whose note names the document by its title.
const readDocument = assistanceToolFixture('read_document')

function newMessage(thread: Thread, now: string, fields: Partial<Message>): Message {
  const message: Message = {
    id: nextCreatedId(IdPrefix.Message, createdMessages),
    thread_id: thread.id,
    sequence: messagesOfThread(thread.id).length + 1,
    run_id: null,
    author: 'user',
    agent_role: null,
    content: '',
    artifact_refs: [],
    item_refs: [],
    commands: [],
    delivery: null,
    delivered_in_step_id: null,
    created_at: now,
    ...fields,
  }
  createdMessages.set([...createdMessages.get(), message])
  return message
}

/**
 * Sends a message of the user to a thread. A message about the app is answered by the assistant, in
 * a run of its own that is still working when this returns (`finishAnswer` ends it), and starts no
 * run of the work. Any other waits for the unfinished run of the thread, or starts a run, and the
 * first message of a thread gives its names to the thread and the project.
 */
export function addMessage(thread: Thread, toSend: MessageToSend): { message: Message; run: Run } {
  const now = mockNow()
  const answer = assistantAnswerOf(toSend.content, thread.project_id)
  if (answer !== null) {
    const documents = readDocumentsOf(answer)
    const run = startAnsweringRun({ threadId: thread.id, projectId: thread.project_id, now })
    const message = newMessage(thread, now, {
      content: toSend.content,
      run_id: run.id,
      delivery: 'delivered',
    })
    pendingAnswers.set([
      ...pendingAnswers.get(),
      {
        runId: run.id,
        threadId: thread.id,
        answer,
        documents,
        // One read of the first document that the answer opens.
        notes: documents.slice(0, 1).map(({ title }): StepNote => ({
          kind: 'tool',
          tool: readDocument.key,
          text: `${readDocument.title}: ${title}`,
          created_at: now,
        })),
      },
    ])
    nameFromFirstMessage(thread, message, false)
    return { message, run }
  }
  const unfinished = thread.active_run_id === null ? undefined : findRun(thread.active_run_id)
  const hasStartedRun = unfinished === undefined
  const run = unfinished ?? startRun(thread, now, toSend)
  const message = newMessage(thread, now, {
    run_id: run.id,
    content: toSend.content,
    delivery: hasStartedRun ? 'started_run' : 'pending',
  })
  nameFromFirstMessage(thread, message, hasStartedRun)
  return { message, run }
}

/** Ends the run that answers a message: the answer is written as a message of the run, with the commands it asks for. */
export function finishAnswer(runId: string): void {
  const pending = pendingAnswers.get().find((entry) => entry.runId === runId)
  const thread = pending === undefined ? undefined : findThread(pending.threadId)
  if (pending === undefined || thread === undefined) return
  const now = mockNow()
  pendingAnswers.set(pendingAnswers.get().filter((entry) => entry.runId !== runId))
  endAnsweringRun(runId, { notes: pending.notes, now })
  newMessage(thread, now, {
    run_id: runId,
    author: 'agent',
    agent_role: assistanceAgentFixture.agent_role,
    content: pending.answer.text,
    artifact_refs: pending.documents,
    commands: pending.answer.commands,
  })
}
