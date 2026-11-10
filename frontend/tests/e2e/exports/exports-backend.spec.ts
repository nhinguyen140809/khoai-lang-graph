import { expect } from '@playwright/test'

import {
  type ApiExport,
  type ApiPage,
  expectAccepted,
  expectOk,
  expectPage,
  expectProblem,
} from '../../shared/api'
import { test } from '../../shared/fixtures.utils'
import { exportedFiles, idea, unsupportedFormats } from './exports-backend.data'

for (const { name, template, format, fileName, contentType, contains } of exportedFiles) {
  test(`exports ${name} and serves the file`, async ({ api, client }) => {
    const { projectId } = await api.startFinishedRun(idea)

    const file = expectAccepted(await api.createExport(projectId, template, format))

    expect(file.status).toBe('ready')
    expect(file.file_name).toBe(fileName)
    const download = await client.download(file.download_url)
    expect(download.status).toBe(200)
    expect(download.headers['content-type']).toContain(contentType)
    expect(download.headers['content-disposition']).toContain(fileName)
    expect(download.body).toContain(contains)
    expect(download.body.length).toBe(file.size_bytes)
  })
}

for (const format of unsupportedFormats) {
  test(`refuses an export as ${format}`, async ({ api }) => {
    const { projectId } = await api.startFinishedRun(idea)

    expectProblem(
      await api.createExport(projectId, 'requirement_specification', format),
      422,
      'validation_failed',
    )
  })
}

test('lists the exports of a project, the newest first', async ({ api, client }) => {
  const { projectId } = await api.startFinishedRun(idea)
  const first = expectAccepted(await api.createExport(projectId, 'product_backlog', 'csv'))
  const second = expectAccepted(await api.createExport(projectId, 'product_backlog', 'json'))

  const page = expectPage(await client.get<ApiPage<ApiExport>>(`/projects/${projectId}/exports`))

  expect(page.items.map((file) => file.id)).toEqual([second.id, first.id])
  expect(expectOk(await client.get<ApiExport>(`/exports/${first.id}`)).file_name).toBe(
    'product_backlog.csv',
  )
})
