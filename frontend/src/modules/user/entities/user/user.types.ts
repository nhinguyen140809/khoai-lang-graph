import { z } from 'zod'

// Temporary hand-written schemas for the account API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const meSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'disabled']),
  email_verified_at: z.iso.datetime().nullable(),
  last_login_at: z.iso.datetime().nullable(),
  monthly_budget_usd: z.number().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type Me = z.infer<typeof meSchema>

/** The fields of the user that the user may change; a field left out keeps its value. */
export interface UpdateMeBody {
  /** Not empty once trimmed, at most 100 characters. */
  display_name?: string
  /** An `http` or `https` address, or null for no picture. */
  avatar_url?: string | null
}

/** The body that changes the password of the user; the other sessions of the user end. */
export interface ChangePasswordBody {
  current_password: string
  /** At least 8 characters, other than the current password. */
  new_password: string
}
