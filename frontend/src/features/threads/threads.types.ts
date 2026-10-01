import { z } from 'zod'

// Temporary hand-written schemas for the threads API.
// TODO: replace with types generated into src/api/generated/ once the threads API exists.
// Field names are provisional.
export const threadSchema = z.object({
  id: z.string(),
  title: z.string(),
  updated_at: z.iso.datetime(),
})

export type Thread = z.infer<typeof threadSchema>

export const listThreadsResponseSchema = z.object({ items: z.array(threadSchema) })

export type ListThreadsResponse = z.infer<typeof listThreadsResponseSchema>
