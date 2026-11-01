// The model catalog: the models that a user may pick, and the agent roles each can serve.

export interface ModelCatalogEntry {
  model_id: string
  provider: string
  display_name: string
  capabilities: string[]
  context_window: number
  input_price_per_mtok: number | null
  output_price_per_mtok: number | null
  cache_read_price_per_mtok: number | null
  cache_write_price_per_mtok: number | null
  allowed_roles: string[]
}

const everyRole = [
  'planner',
  'persona_generator',
  'interviewer',
  'persona_agent',
  'analyst',
  'requirement_engineer',
  'backlog_manager',
  'validator',
  'intent_router',
]

const small = ['persona_agent', 'interviewer', 'intent_router', 'persona_generator', 'planner']

const base = {
  cache_read_price_per_mtok: null,
  cache_write_price_per_mtok: null,
} as const

export const mockModels: ModelCatalogEntry[] = [
  {
    model_id: 'anthropic:claude-opus-5-5',
    provider: 'anthropic',
    display_name: 'Claude Opus 5.5',
    capabilities: ['tool_calling', 'structured_output', 'streaming', 'vision'],
    context_window: 500_000,
    input_price_per_mtok: 5,
    output_price_per_mtok: 25,
    cache_read_price_per_mtok: 0.5,
    cache_write_price_per_mtok: 6.25,
    allowed_roles: everyRole,
  },
  {
    model_id: 'anthropic:claude-sonnet-5-5',
    provider: 'anthropic',
    display_name: 'Claude Sonnet 5.5',
    capabilities: ['tool_calling', 'structured_output', 'streaming', 'vision'],
    context_window: 500_000,
    input_price_per_mtok: 3,
    output_price_per_mtok: 15,
    cache_read_price_per_mtok: 0.3,
    cache_write_price_per_mtok: 3.75,
    allowed_roles: everyRole,
  },
  {
    model_id: 'anthropic:claude-haiku-5-5',
    provider: 'anthropic',
    display_name: 'Claude Haiku 5.5',
    capabilities: ['tool_calling', 'structured_output', 'streaming'],
    context_window: 200_000,
    input_price_per_mtok: 1,
    output_price_per_mtok: 5,
    cache_read_price_per_mtok: 0.1,
    cache_write_price_per_mtok: 1.25,
    allowed_roles: small,
  },
  {
    model_id: 'openai:gpt-4.1',
    provider: 'openai',
    display_name: 'GPT-4.1',
    capabilities: ['tool_calling', 'structured_output', 'streaming', 'vision'],
    context_window: 1_000_000,
    input_price_per_mtok: 2,
    output_price_per_mtok: 8,
    ...base,
    cache_read_price_per_mtok: 0.5,
    allowed_roles: everyRole,
  },
  {
    model_id: 'openai:gpt-4.1-mini',
    provider: 'openai',
    display_name: 'GPT-4.1 mini',
    capabilities: ['tool_calling', 'structured_output', 'streaming'],
    context_window: 1_000_000,
    input_price_per_mtok: 0.4,
    output_price_per_mtok: 1.6,
    ...base,
    allowed_roles: small,
  },
  {
    model_id: 'local:llama-3.3-70b',
    provider: 'local',
    display_name: 'Llama 3.3 70B (local)',
    capabilities: ['tool_calling', 'streaming'],
    context_window: 128_000,
    input_price_per_mtok: null,
    output_price_per_mtok: null,
    ...base,
    allowed_roles: ['persona_agent', 'interviewer'],
  },
]
