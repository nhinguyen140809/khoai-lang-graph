import { z } from 'zod'

// Temporary hand-written schemas for the model settings API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** The model that the user chose for one agent role; a role without one uses the server default. */
export const modelSettingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  agent_role: z.string(),
  /** A model of the catalog that serves the role. */
  model_id: z.string(),
  /** From 0 to 1; null for the default of the role. */
  temperature: z.number().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
export type ModelSetting = z.infer<typeof modelSettingSchema>

/** The body that replaces the model settings of the user; a role left out uses the server default. */
export interface ReplaceModelSettingsBody {
  items: Pick<ModelSetting, 'agent_role' | 'model_id' | 'temperature'>[]
}
