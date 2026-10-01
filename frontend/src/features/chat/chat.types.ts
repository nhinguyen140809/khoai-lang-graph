import { z } from 'zod'

// Temporary hand-written schemas for the run event stream (docs/PLANNING.md section 6).
// TODO: replace with types generated into src/api/generated/ once the backend registers
// features/runs/events.py as OpenAPI components. Payload fields are provisional.
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
  interrupt: z.object({ node: z.string(), payload: z.unknown() }),
  error: z.object({ message: z.string() }),
  done: z.object({}),
}

export type RunEventType = keyof typeof runEventSchemas

export const RUN_EVENT_TYPES = Object.keys(runEventSchemas) as RunEventType[]

export type RunEvent = {
  [K in RunEventType]: { type: K; id: string; data: z.infer<(typeof runEventSchemas)[K]> }
}[RunEventType]

export type RunStatus = 'streaming' | 'interrupted' | 'succeeded' | 'failed'

export const createRunResponseSchema = z.object({ run_id: z.string() })

export type CreateRunResponse = z.infer<typeof createRunResponseSchema>

export interface ChatTurn {
  id: string
  prompt: string
  runId: string
}
