import { expect } from '@playwright/test'

import { expectCreated, expectOk } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { idea } from './runs-backend.data'

test('fails a run that takes more steps than it is allowed', async ({ api }) => {
  const { run } = await api.startRun(idea, { maxSteps: 3 })

  const failed = await api.waitForRun(run.id, ['failed'])

  expect(failed.error?.code).toBe('step_limit_exceeded')
})

test('answers a repeated message with the same key by the first answer', async ({ api }) => {
  const projectId = await api.createProject('Idempotent sender')
  const threadId = await api.createThread(projectId)
  const key = `message-${Date.now().toString()}`

  const first = await api.sendMessage(threadId, idea, { idempotencyKey: key })
  const again = await api.sendMessage(threadId, idea, { idempotencyKey: key })

  expect(again.id).toBe(first.id)
  await api.waitForRun(first.id, ['succeeded'])
})

test('makes one project for a repeated request with the same key', async ({ client }) => {
  const key = `project-${Date.now().toString()}`

  const first = expectCreated(
    await client.post<{ id: string }>('/projects', { name: 'Keyed' }, { idempotencyKey: key }),
  )
  const again = await client.post<{ id: string }>(
    '/projects',
    { name: 'Keyed' },
    { idempotencyKey: key },
  )

  expect(again.body.id).toBe(first.id)
  expect(expectOk(await client.get<{ name: string }>(`/projects/${first.id}`)).name).toBe('Keyed')
})
