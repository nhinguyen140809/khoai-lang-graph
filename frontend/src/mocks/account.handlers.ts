import { http, HttpResponse } from 'msw'

import {
  costOf,
  mockModelChoices,
  mockSessions,
  mockUsageRecords,
  type ModelChoice,
} from './account.fixtures'
import { meRecord } from './me.handlers'
import { mockRecord } from './mock-db.utils'
import { answerScenario, mockScenario } from './mock-scenario.utils'
import { mockModels } from './models.fixtures'
import { paginate } from './pagination.utils'
import { notFound, problem } from './problem.utils'

// What the user changed: the sessions that were revoked, and the model choices.
const revokedSessions = mockRecord<string[]>('revoked-sessions', () => [])
const modelChoices = mockRecord<ModelChoice[]>('model-choices', () => mockModelChoices)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const groupKeys = {
  day: (record: (typeof mockUsageRecords)[number]) => record.day,
  project: (record: (typeof mockUsageRecords)[number]) => record.project,
  agent_role: (record: (typeof mockUsageRecords)[number]) => record.agent_role,
  model: (record: (typeof mockUsageRecords)[number]) => record.model_id,
} as const

function usageOf(records: typeof mockUsageRecords) {
  return {
    input_tokens: records.reduce((sum, record) => sum + record.input_tokens, 0),
    output_tokens: records.reduce((sum, record) => sum + record.output_tokens, 0),
    cache_read_tokens: records.reduce((sum, record) => sum + record.cache_read_tokens, 0),
    cache_write_tokens: records.reduce((sum, record) => sum + record.cache_write_tokens, 0),
    cost_usd: Math.round(records.reduce((sum, record) => sum + costOf(record), 0) * 1000) / 1000,
  }
}

export const accountHandlers = [
  http.patch('/api/v1/me', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null)
    if (!isRecord(body)) return problem(400, 'invalid_request', 'Invalid request')
    if (
      'display_name' in body &&
      (typeof body.display_name !== 'string' || body.display_name.trim() === '')
    ) {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'display_name', message: 'Enter your name.' },
      ])
    }
    const me = meRecord.get()
    const changed = {
      ...me,
      ...('display_name' in body && { display_name: String(body.display_name).trim() }),
      ...('avatar_url' in body && {
        avatar_url:
          typeof body.avatar_url === 'string' && body.avatar_url !== '' ? body.avatar_url : null,
      }),
      updated_at: new Date().toISOString(),
    }
    meRecord.set(changed)
    return HttpResponse.json(changed)
  }),

  http.post('/api/v1/me/password', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null)
    const current = isRecord(body) ? body.current_password : undefined
    const next = isRecord(body) ? body.new_password : undefined
    if (mockScenario('password') === 'error' || typeof current !== 'string' || current === '') {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'current_password', message: 'The current password is wrong.' },
      ])
    }
    if (typeof next !== 'string' || next.length < 8) {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'new_password', message: 'Use at least 8 characters.' },
      ])
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/v1/me/sessions', async ({ request }) => {
    const answered = await answerScenario(mockScenario('sessions'))
    if (answered !== null) return answered
    const revoked = revokedSessions.get()
    return HttpResponse.json(
      paginate(
        mockSessions.filter(({ id }) => !revoked.includes(id)),
        request,
      ),
    )
  }),

  http.delete('/api/v1/me/sessions/:sessionId', ({ params }) => {
    const id = String(params.sessionId)
    const session = mockSessions.find((entry) => entry.id === id)
    if (session === undefined || revokedSessions.get().includes(id)) return notFound('The session')
    revokedSessions.set([...revokedSessions.get(), id])
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/v1/me/model-settings', async ({ request }) => {
    const answered = await answerScenario(mockScenario('model-settings'))
    if (answered !== null) return answered
    return HttpResponse.json(paginate(modelChoices.get(), request))
  }),

  http.put('/api/v1/me/model-settings', async ({ request }) => {
    const body: unknown = await request.json().catch(() => null)
    const items = isRecord(body) && Array.isArray(body.items) ? body.items : null
    if (items === null) {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'items', message: 'Send the choices.' },
      ])
    }
    const problems = items.flatMap((item, index) => {
      if (!isRecord(item)) return [{ field: `items.${String(index)}`, message: 'Not a choice.' }]
      const model = mockModels.find(({ model_id }) => model_id === item.model_id)
      const role = String(item.agent_role)
      if (!model?.allowed_roles.includes(role)) {
        return [{ field: `items.${role}`, message: 'This model cannot serve this role.' }]
      }
      const temperature = item.temperature
      if (
        temperature !== null &&
        temperature !== undefined &&
        (typeof temperature !== 'number' || temperature < 0 || temperature > 2)
      ) {
        return [{ field: `items.${role}.temperature`, message: 'Enter a number from 0 to 2.' }]
      }
      return []
    })
    if (problems.length > 0)
      return problem(422, 'validation_failed', 'Validation failed', null, problems)
    const saved = items.map((item) => {
      const choice = item as Record<string, unknown>
      return {
        agent_role: String(choice.agent_role),
        model_id: String(choice.model_id),
        temperature: typeof choice.temperature === 'number' ? choice.temperature : null,
      }
    })
    modelChoices.set(saved)
    return HttpResponse.json(paginate(saved, request))
  }),

  http.get('/api/v1/me/usage', async ({ request }) => {
    const answered = await answerScenario(mockScenario('usage'))
    if (answered !== null) return answered
    const groupBy = new URL(request.url).searchParams.get('group_by') ?? 'day'
    if (!(groupBy in groupKeys)) {
      return problem(422, 'validation_failed', 'Validation failed', null, [
        { field: 'group_by', message: 'Use day, project, agent_role or model.' },
      ])
    }
    const keyOf = groupKeys[groupBy as keyof typeof groupKeys]
    if (mockScenario('usage') === 'empty') {
      return HttpResponse.json({ group_by: groupBy, total: usageOf([]), items: [] })
    }
    const keys = [...new Set(mockUsageRecords.map(keyOf))].toSorted((a, b) =>
      groupBy === 'day' ? b.localeCompare(a) : a.localeCompare(b),
    )
    return HttpResponse.json({
      group_by: groupBy,
      total: usageOf(mockUsageRecords),
      items: keys.map((key) => ({
        key,
        ...usageOf(mockUsageRecords.filter((record) => keyOf(record) === key)),
      })),
    })
  }),
]
