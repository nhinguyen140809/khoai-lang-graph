import type { RunDefaults, StepNote } from '@/modules/run/entities'
import type { Message, UiCommand } from '@/modules/thread/entities'

// A message to send, as its body gives it once its fields have no problem: the validators read the
// body into it, and the changes send the message that it holds.

/** A message to send: its content, and the settings and models of the run it starts. */
export interface MessageToSend {
  content: string
  /** The settings of the run that the message starts, when it starts one. */
  runDefaults?: RunDefaults
  /** The models of the run that the message starts, by agent role, when it starts one. */
  models?: Record<string, string>
}

/** What the mock assistant answers: the words, which become a message of the run, and the UI commands. */
export interface MockAnswer {
  text: string
  commands: UiCommand[]
}

/** An answer that the mock assistant has not written yet: its run is still working. */
export interface PendingAnswer {
  runId: string
  threadId: string
  answer: MockAnswer
  /** The documents that the answer was read from. */
  documents: Message['artifact_refs']
  notes: StepNote[]
}
