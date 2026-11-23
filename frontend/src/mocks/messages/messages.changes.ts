import type { Run, StepNote } from '@/modules/run/entities'
import type { Message, Thread, UiCommand } from '@/modules/thread/entities'

import { findArtifact } from '../artifacts/artifacts.lookup'
import { changeProject } from '../projects/projects.lookup'
import { findRun } from '../runs/lookup/runs.lookup'
import { addAnsweredRun, addRun } from '../runs/runs.changes'
import { IdPrefix, mockNow, nextCreatedId } from '../shared/db'
import { changeThread } from '../threads/threads.changes'
import { assistanceAgentFixture, assistanceToolFixture } from '../workflow/workflow.fixtures'
import { assistantAnswerOf } from './message-assistant.utils'
import { messagesOfThread } from './messages.lookup'
import { createdMessages } from './messages.store'
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

// The tool that the mock assistant reads with before it opens a document, as the definition names it.
const listDocuments = assistanceToolFixture('list_documents')

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
    delivery: null,
    delivered_in_step_id: null,
    created_at: now,
    ...fields,
  }
  createdMessages.set([...createdMessages.get(), message])
  return message
}

/**
 * Sends a message of the user to a thread. A message about the app is answered by the assistant,
 * which starts no run: both are messages of no run. Any other waits for the unfinished run of the
 * thread, or starts a run, and the first message of a thread gives its names to the thread and the
 * project.
 */
export function addMessage(
  thread: Thread,
  toSend: MessageToSend,
): { message: Message; run: Run; commands: UiCommand[] } {
  const now = mockNow()
  const answer = assistantAnswerOf(toSend.content, thread.project_id)
  if (answer !== null) {
    const documents = readDocumentsOf(answer)
    const run = addAnsweredRun({
      threadId: thread.id,
      projectId: thread.project_id,
      now,
      // One read of the list of documents, whatever the answer opens.
      notes:
        documents.length === 0
          ? []
          : [
              {
                kind: 'tool',
                tool: listDocuments.key,
                text: listDocuments.title,
                created_at: now,
              } satisfies StepNote,
            ],
    })
    const message = newMessage(thread, now, { content: toSend.content, run_id: run.id })
    newMessage(thread, now, {
      run_id: run.id,
      author: 'agent',
      agent_role: assistanceAgentFixture.agent_role,
      content: answer.text,
      artifact_refs: documents,
    })
    nameFromFirstMessage(thread, message, false)
    return { message, run, commands: answer.commands }
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
  return { message, run, commands: [] }
}
