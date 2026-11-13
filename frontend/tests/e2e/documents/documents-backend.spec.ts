import { expect } from '@playwright/test'

import type { ApiDocument } from '../../shared/api'
import { expectNoContent, expectOk, expectProblem } from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { notes, notesRevised } from './documents-backend.data'

test('uploads a document, lists it, reads it and removes it', async ({ api, client }) => {
  const projectId = await api.createProject('Document owner')

  const uploaded = await api.uploadDocument(projectId, notes.fileName, notes.text, {
    title: notes.title,
  })

  expect(uploaded.title).toBe(notes.title)
  expect((await api.listDocuments(projectId)).map((document) => document.id)).toEqual([uploaded.id])
  const read = expectOk(await client.get<ApiDocument>(`/documents/${uploaded.id}`))
  expect(JSON.stringify(read)).toContain(notes.text.slice(0, 20))
  expectNoContent(await api.deleteDocument(uploaded.id))
  expectProblem(await client.get(`/documents/${uploaded.id}`), 404, 'not_found')
  expect(await api.listDocuments(projectId)).toEqual([])
})

test('keeps both texts when a document is uploaded again as a new version', async ({
  api,
  client,
}) => {
  const projectId = await api.createProject('Versions owner')
  const first = await api.uploadDocument(projectId, notes.fileName, notes.text, {
    title: notes.title,
  })

  const second = await api.uploadDocument(projectId, notes.fileName, notesRevised.text, {
    title: notes.title,
    first_version_id: first.id,
  })

  expect(second.id).toBe(first.id)
  const older = expectOk(await client.get<ApiDocument>(`/documents/${first.id}`, { version: 1 }))
  const latest = expectOk(await client.get<ApiDocument>(`/documents/${first.id}`))
  expect(older.text).toBe(notes.text)
  expect(latest.text).toBe(notesRevised.text)
  expect(second.versions).toHaveLength(2)
})

test('refuses an upload with no file', async ({ api, client }) => {
  const projectId = await api.createProject('Empty upload')

  expectProblem(await client.post(`/projects/${projectId}/documents`, {}), 422, 'validation_failed')
})
