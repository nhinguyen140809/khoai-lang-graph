import { IdPrefix, mockId } from './mock-ids.constants'
import { mockModels } from './models.fixtures'

// The login sessions of the user, the model choices of the user, and the usage of their runs.

export interface MockSession {
  id: string
  created_at: string
  last_used_at: string
  ip_address: string
  user_agent: string
  current: boolean
}

export const mockSessions: MockSession[] = [
  {
    id: mockId(IdPrefix.Session, 1),
    created_at: '2026-10-06T08:20:00Z',
    last_used_at: '2026-10-06T09:41:00Z',
    ip_address: '203.0.113.24',
    user_agent: 'Chrome 141 on Windows 11',
    current: true,
  },
  {
    id: mockId(IdPrefix.Session, 2),
    created_at: '2026-10-03T19:02:00Z',
    last_used_at: '2026-10-05T21:15:00Z',
    ip_address: '198.51.100.7',
    user_agent: 'Safari 19 on iPhone',
    current: false,
  },
  {
    id: mockId(IdPrefix.Session, 3),
    created_at: '2026-09-21T07:45:00Z',
    last_used_at: '2026-09-30T10:03:00Z',
    ip_address: '192.0.2.130',
    user_agent: 'Firefox 143 on Ubuntu',
    current: false,
  },
]

export interface ModelChoice {
  agent_role: string
  model_id: string
  temperature: number | null
}

export const mockModelChoices: ModelChoice[] = [
  { agent_role: 'analyst', model_id: 'anthropic:claude-opus-5-5', temperature: null },
  { agent_role: 'persona_agent', model_id: 'anthropic:claude-haiku-5-5', temperature: 0.8 },
]

export interface UsageRecord {
  day: string
  project: string
  agent_role: string
  model_id: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
}

const roles = [
  ['planner', 'anthropic:claude-sonnet-5-5'],
  ['persona_generator', 'anthropic:claude-haiku-5-5'],
  ['interviewer', 'anthropic:claude-haiku-5-5'],
  ['persona_agent', 'anthropic:claude-haiku-5-5'],
  ['analyst', 'anthropic:claude-opus-5-5'],
  ['requirement_engineer', 'anthropic:claude-sonnet-5-5'],
  ['backlog_manager', 'anthropic:claude-sonnet-5-5'],
  ['validator', 'openai:gpt-4.1'],
] as const

const projects = ['Mentor platform', 'Campus parking', 'Library seats']

/** Seven days of calls, one record for each day, project and role, with figures that vary a little. */
export const mockUsageRecords: UsageRecord[] = Array.from({ length: 7 }, (_, dayIndex) =>
  projects.flatMap((project, projectIndex) =>
    roles.map(([role, model], roleIndex) => {
      const seed = (dayIndex + 1) * 7 + (projectIndex + 1) * 3 + roleIndex
      const scale = projectIndex === 0 ? 3 : 1
      return {
        day: `2026-10-${String(6 - dayIndex).padStart(2, '0')}`,
        project,
        agent_role: role,
        model_id: model,
        input_tokens: (900 + (seed % 5) * 400) * scale * (roleIndex === 4 ? 3 : 1),
        output_tokens: (300 + (seed % 4) * 150) * scale,
        cache_read_tokens: (seed % 3) * 600 * scale,
        cache_write_tokens: (seed % 2) * 300 * scale,
      }
    }),
  ),
).flat()

/** The price of a record, from the prices of its model in the catalog. */
export function costOf(record: UsageRecord): number {
  const model = mockModels.find(({ model_id }) => model_id === record.model_id)
  const per = (tokens: number, price: number | null | undefined) => (tokens * (price ?? 0)) / 1e6
  return (
    per(record.input_tokens, model?.input_price_per_mtok) +
    per(record.output_tokens, model?.output_price_per_mtok) +
    per(record.cache_read_tokens, model?.cache_read_price_per_mtok) +
    per(record.cache_write_tokens, model?.cache_write_price_per_mtok)
  )
}
