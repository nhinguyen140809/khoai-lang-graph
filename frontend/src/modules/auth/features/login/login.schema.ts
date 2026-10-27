import { z } from 'zod'

// The form of the login page. Its fields are named after the fields of the request, so a problem
// of a field that the API answers can be shown at the field of the form.

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type LoginForm = z.infer<typeof loginFormSchema>
