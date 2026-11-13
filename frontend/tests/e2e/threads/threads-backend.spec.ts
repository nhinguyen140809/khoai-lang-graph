import { expect } from '@playwright/test'

import { expectNoContent, expectOk, expectProblem } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'

test('makes a thread in a project, retitles it, archives it and removes it', async ({
  api,
  client,
}) => {
  const projectId = await api.createProject('Thread owner')
  const threadId = await api.createThread(projectId)

  const retitled = expectOk(await api.updateThread(threadId, { title: 'Discovery' }))
  expect(retitled.title).toBe('Discovery')
  expect((await api.listThreads(projectId)).map((thread) => thread.id)).toContain(threadId)
  const archived = expectOk(await api.updateThread(threadId, { status: 'archived' }))
  expect(archived.status).toBe('archived')
  expectNoContent(await api.deleteThread(threadId))

  expectProblem(await client.get(`/threads/${threadId}`), 404, 'not_found')
  expect((await api.listThreads(projectId)).map((thread) => thread.id)).not.toContain(threadId)
})

test('answers 404 for a thread that does not exist', async ({ client }) => {
  expectProblem(await client.get('/threads/00000000-0000-4000-8000-000000000000'), 404, 'not_found')
})
