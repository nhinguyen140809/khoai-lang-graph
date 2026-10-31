import { z } from 'zod'

// Temporary hand-written schemas for the model catalog API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** What a model can do; a role needs some of them, and the catalog says which roles a model serves. */
export const modelCapabilities = [
  'tool_calling',
  'structured_output',
  'streaming',
  'vision',
] as const
export type ModelCapability = (typeof modelCapabilities)[number]

/** A model that the user may choose, as the server configures it; identified by `model_id`. */
export const modelCatalogEntrySchema = z.object({
  /** `provider:model`, such as `openai:gpt-4.1`. */
  model_id: z.string(),
  provider: z.string(),
  display_name: z.string(),
  capabilities: z.array(z.enum(modelCapabilities)),
  /** In tokens. */
  context_window: z.number().int(),
  /** USD per million input tokens; null when the model has no price, such as a local one. */
  input_price_per_mtok: z.number().nullable(),
  /** USD per million output tokens. */
  output_price_per_mtok: z.number().nullable(),
  /** USD per million input tokens read from the prompt cache of the provider. */
  cache_read_price_per_mtok: z.number().nullable(),
  /** USD per million input tokens written to the prompt cache of the provider. */
  cache_write_price_per_mtok: z.number().nullable(),
  /** The agent roles that the model may serve. */
  allowed_roles: z.array(z.string()),
})
export type ModelCatalogEntry = z.infer<typeof modelCatalogEntrySchema>
