import { z } from 'zod'

import { type UserSettingsSection, userSettingsSections } from '@/shared/config/routes'

// Temporary hand-written schemas for the settings API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export const userSettingsSchema = z.object({
  user_id: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  ui_language: z.enum(['en', 'vi']),
  default_output_language: z.enum(['en', 'vi']),
  /** Used for every field that a project leaves empty. */
  default_run_config: z.object({
    review_checkpoints: z.array(z.string()).nullable(),
    max_steps: z.number().int().nullable(),
    max_cost_usd: z.number().nullable(),
    parameters: z.record(z.string(), z.unknown()).nullable(),
  }),
  notify_on_interrupt: z.boolean(),
  notify_on_run_finished: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export type UserSettings = z.infer<typeof userSettingsSchema>

export const profileSchema = z.looseObject({
  id: z.string(),
  email: z.string(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
})

export type Profile = z.infer<typeof profileSchema>

export const sessionSchema = z.object({
  id: z.string(),
  created_at: z.iso.datetime(),
  last_used_at: z.iso.datetime(),
  ip_address: z.string(),
  user_agent: z.string(),
  /** The session of this browser. */
  current: z.boolean(),
})

export type LoginSession = z.infer<typeof sessionSchema>

export const modelChoiceSchema = z.object({
  agent_role: z.string(),
  model_id: z.string(),
  temperature: z.number().nullable(),
})

export type ModelChoice = z.infer<typeof modelChoiceSchema>

export const catalogModelSchema = z.looseObject({
  model_id: z.string(),
  provider: z.string(),
  display_name: z.string(),
  allowed_roles: z.array(z.string()),
  input_price_per_mtok: z.number().nullable(),
  output_price_per_mtok: z.number().nullable(),
})

export type CatalogModel = z.infer<typeof catalogModelSchema>

export const usageGroups = ['day', 'project', 'agent_role', 'model'] as const

export type UsageGroup = (typeof usageGroups)[number]

export const usageGroupLabels = {
  day: 'Day',
  project: 'Project',
  agent_role: 'Agent role',
  model: 'Model',
} as const satisfies Record<UsageGroup, string>

const usageFigures = {
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_tokens: z.number().int(),
  cache_write_tokens: z.number().int(),
  cost_usd: z.number(),
}

export const usageSchema = z.object({
  group_by: z.enum(usageGroups),
  total: z.object(usageFigures),
  items: z.array(z.object({ key: z.string(), ...usageFigures })),
})

export type UserUsage = z.infer<typeof usageSchema>

export const settingsSections = userSettingsSections

export type SettingsSection = UserSettingsSection

export const settingsSectionLabels = {
  profile: 'Profile',
  password: 'Password',
  preferences: 'Preferences',
  models: 'Models',
  usage: 'Usage',
  sessions: 'Login sessions',
} as const satisfies Record<SettingsSection, string>
