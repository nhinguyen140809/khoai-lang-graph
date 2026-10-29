import { z } from 'zod'

// Temporary hand-written schemas for the run event stream. Payload fields are provisional.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.
export const runEventSchemas = {
  node_start: z.object({ node: z.string() }),
  node_end: z.object({ node: z.string() }),
  token: z.object({ node: z.string(), text: z.string() }),
  tool_call: z.object({
    node: z.string(),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),
  artifact_created: z.object({ artifact_id: z.string(), name: z.string(), version: z.number() }),
  artifact_delta: z.object({ artifact_id: z.string(), delta: z.string() }),
  message_delivered: z.object({}),
  interrupt: z.object({ node: z.string(), payload: z.unknown() }),
  error: z.object({ message: z.string() }),
  done: z.object({}),
}

export type RunEventType = keyof typeof runEventSchemas

export const runEventTypes = Object.keys(runEventSchemas) as RunEventType[]

export type RunEvent = {
  [K in RunEventType]: { type: K; id: string; data: z.infer<(typeof runEventSchemas)[K]> }
}[RunEventType]

/** Where the stream of a run is, as the events read so far tell it. */
export type RunStreamStatus = 'streaming' | 'interrupted' | 'succeeded' | 'failed'
