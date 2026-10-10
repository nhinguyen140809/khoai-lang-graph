import { z } from 'zod'

// Temporary hand-written schemas for the authentication and account API.
// TODO: replace with the types generated into src/api/generated/ once they exist.

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

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody {
  email: string
  password: string
  display_name: string
}
