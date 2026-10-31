import type { RunDefaults } from '@/modules/run/entities'

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
