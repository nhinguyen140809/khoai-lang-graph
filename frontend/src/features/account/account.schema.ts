import { z } from 'zod'

// The forms of the account pages. Their fields are named after the fields of the requests, so a
// problem of a field that the API answers can be shown at the field of the form.

export const signInFormSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type SignInForm = z.infer<typeof signInFormSchema>

export const accountFormSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name.'),
  email: z.email('Enter an email address.'),
  password: z.string().min(1, 'Enter a password.'),
})

export type AccountForm = z.infer<typeof accountFormSchema>
