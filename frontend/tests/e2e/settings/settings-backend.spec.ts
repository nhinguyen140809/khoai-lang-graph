import { expect } from '@playwright/test'

import { type ApiPage, expectOk, expectPage, expectProblem } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { changedSettings, refusedSettings } from './settings-backend.data'

type Settings = Record<string, unknown>

/** The fields of the settings that a put replaces: the ones the API fills in are left out. */
function replaceable(settings: Settings): Settings {
  return Object.fromEntries(
    Object.entries(settings).filter(
      ([field]) => !['user_id', 'created_at', 'updated_at'].includes(field),
    ),
  )
}

test('keeps the settings that the user put and gives them back', async ({ client }) => {
  const before = expectOk(await client.get<Settings>('/me/settings'))
  try {
    expectOk(await client.put<Settings>('/me/settings', changedSettings))

    const after = expectOk(await client.get<Settings>('/me/settings'))
    expect(after).toMatchObject(changedSettings)
  } finally {
    expectOk(await client.put<Settings>('/me/settings', replaceable(before)))
  }
})

for (const { name, change, field } of refusedSettings) {
  test(`refuses ${name}`, async ({ client }) => {
    const before = expectOk(await client.get<Settings>('/me/settings'))

    expectProblem(
      await client.put('/me/settings', { ...replaceable(before), ...change }),
      422,
      'validation_failed',
      field,
    )
  })
}

test('keeps the models that the user chose for the roles of the agents', async ({ client }) => {
  const before = expectPage(await client.get<ApiPage<Settings>>('/me/model-settings'))
  const models = expectPage(await client.get<ApiPage<{ model_id: string }>>('/models'))
  const model = models.items[0]?.model_id ?? ''
  try {
    const chosen = [{ agent_role: 'planner', model_id: model, temperature: 0.3 }]

    expectPage(await client.put<ApiPage<Settings>>('/me/model-settings', { items: chosen }))

    const after = expectPage(await client.get<ApiPage<Settings>>('/me/model-settings'))
    expect(after.items).toEqual(chosen)
  } finally {
    await client.put('/me/model-settings', { items: before.items })
  }
})

test('refuses a model setting for a role that no agent has', async ({ client }) => {
  const models = expectPage(await client.get<ApiPage<{ model_id: string }>>('/models'))

  expectProblem(
    await client.put('/me/model-settings', {
      items: [{ agent_role: 'nobody', model_id: models.items[0]?.model_id ?? '' }],
    }),
    422,
    'validation_failed',
  )
})

test('tells what the user spent this month and the budget', async ({ client }) => {
  const usage = expectOk(
    await client.get<{ month: string; budget_usd: number; total: { cost_usd: number } }>(
      '/me/usage',
    ),
  )

  expect(usage.month).toMatch(/^\d{4}-\d{2}$/)
  expect(usage.budget_usd).toBeGreaterThan(0)
  expect(usage.total.cost_usd).toBeGreaterThanOrEqual(0)
})

test('lists the sessions of the user with the current one marked', async ({ client }) => {
  const page = expectPage(
    await client.get<ApiPage<{ id: string; current: boolean }>>('/me/sessions'),
  )

  expect(page.items.filter((session) => session.current)).toHaveLength(1)
})

test('refuses to end a session that does not exist', async ({ client }) => {
  expectProblem(
    await client.remove('/me/sessions/00000000-0000-4000-8000-000000000000'),
    404,
    'not_found',
  )
})

test('describes the workflow and the models that can be chosen', async ({ client }) => {
  const workflow = expectOk(
    await client.get<{ name: string; version: number }>('/workflow/definition'),
  )
  const models = expectPage(await client.get<ApiPage<{ model_id: string }>>('/models'))

  expect(workflow.name).toBe('requirements_engineering')
  expect(models.items.length).toBeGreaterThan(0)
})
