import { z } from 'zod'

// The form of the page that creates an account. Its fields are named after the fields of the
// request, so a problem of a field that the API answers can be shown at the field of the form.

export const accountFormSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name.'),
  email: z.email('Enter an email address.'),
  password: z.string().min(1, 'Enter a password.'),
})

export type AccountForm = z.infer<typeof accountFormSchema>
