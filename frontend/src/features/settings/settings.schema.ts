import { z } from 'zod'

import { type ParameterField, runFormSchema } from '@/shared/components/run-config'

import { userSettingsSchema } from './settings.types'

// The forms of the settings of the user. Their fields are named after the fields of the requests,
// and the value of each schema is the body of its request.

const MIN_PASSWORD_LENGTH = 8

export const profileFormSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name.'),
  /** The address of a picture; empty shows the initials. */
  avatar_url: z
    .string()
    .trim()
    .transform((text) => (text === '' ? null : text)),
})

export type ProfileForm = z.input<typeof profileFormSchema>

export const passwordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    new_password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${String(MIN_PASSWORD_LENGTH)} characters.`),
    /** The new password typed again; it is not sent. */
    again: z.string(),
  })
  .refine(({ new_password, again }) => again === new_password, {
    message: 'The two passwords differ.',
    path: ['again'],
  })
  .transform(({ current_password, new_password }) => ({ current_password, new_password }))

export type PasswordForm = z.input<typeof passwordFormSchema>

/** The preferences, with the run settings that every project starts from. */
export function preferencesFormSchema(fields: ParameterField[]) {
  const { theme, ui_language, default_output_language } = userSettingsSchema.shape
  return z.object({
    theme,
    ui_language,
    default_output_language,
    notify_on_interrupt: z.boolean(),
    notify_on_run_finished: z.boolean(),
    default_run_config: runFormSchema(fields),
  })
}

export type PreferencesForm = z.input<ReturnType<typeof preferencesFormSchema>>

const temperature = z.string().superRefine((text, context) => {
  const trimmed = text.trim()
  if (trimmed === '') return
  const value = Number(trimmed)
  if (!(value >= 0 && value <= 2)) {
    context.addIssue({ code: 'custom', message: 'Enter a number from 0 to 2.' })
  }
})

/** The model and the temperature of each agent role; a role left on '' takes the server default. */
export const modelChoicesFormSchema = z
  .object({
    choices: z.record(z.string(), z.object({ model_id: z.string(), temperature })),
  })
  .transform(({ choices }) =>
    Object.entries(choices)
      .filter(([, choice]) => choice.model_id !== '')
      .map(([agent_role, choice]) => ({
        agent_role,
        model_id: choice.model_id,
        temperature: choice.temperature.trim() === '' ? null : Number(choice.temperature),
      })),
  )

export type ModelChoicesForm = z.input<typeof modelChoicesFormSchema>
