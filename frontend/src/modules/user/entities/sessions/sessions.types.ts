import { z } from 'zod'

// Temporary hand-written schemas for the sessions API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** A device where the user is signed in; the token of the session is never sent. */
export const sessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  expires_at: z.iso.datetime(),
  last_seen_at: z.iso.datetime(),
  /** The browser and the system, as the device sent them. */
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  /** Null in the list, which holds the sessions that are not revoked. */
  revoked_at: z.iso.datetime().nullable(),
  /** True for the session of this browser. */
  current: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Session = z.infer<typeof sessionSchema>
