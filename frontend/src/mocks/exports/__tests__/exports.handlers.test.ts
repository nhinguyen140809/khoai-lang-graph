import { describe, expect, it, vi } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus, MediaType } from '@/shared/api/http'
import { apiUrl } from '@/shared/api/request'
import { type ApiCall, callApi } from '@/test/msw'

import { projectIds, userId } from '../../shared/db'

interface ExportBody {
  id: string
  status: string
  requested_by: string
  included_artifacts: { kind: string }[]
  download_url: string | null
}

const projectPath = apiEndpoints.projectExports.path({ projectId: projectIds.mentor })

describe('the export handlers', () => {
  it('return the same export for a repeated idempotency key', async () => {
    const request: ApiCall = {
      method: 'POST',
      path: projectPath,
      body: { template: 'full_project', format: 'markdown' },
      headers: { [HttpHeader.IdempotencyKey]: 'same-export' },
    }

    const first = await callApi(request)
    const second = await callApi(request)

    expect(first.status).toBe(HttpStatus.Accepted)
    expect(first.body).toMatchObject({ status: 'pending', requested_by: userId })
    expect((second.body as ExportBody).included_artifacts.length).toBeGreaterThan(0)
    expect(second.body).toEqual(first.body)
  })

  it('answer 409 when the same idempotency key comes with another body', async () => {
    await callApi({
      method: 'POST',
      path: projectPath,
      body: { template: 'full_project', format: 'markdown' },
      headers: { [HttpHeader.IdempotencyKey]: 'conflict-export' },
    })

    const answer = await callApi({
      method: 'POST',
      path: projectPath,
      body: { template: 'full_project', format: 'pdf' },
      headers: { [HttpHeader.IdempotencyKey]: 'conflict-export' },
    })

    expect(answer.status).toBe(HttpStatus.Conflict)
    expect(answer.body).toMatchObject({ code: 'idempotency_conflict' })
  })

  it('serves the generated file when an export is ready', async () => {
    vi.useFakeTimers()
    const created = await callApi({
      method: 'POST',
      path: projectPath,
      body: { template: 'full_project', format: 'markdown' },
      headers: { [HttpHeader.IdempotencyKey]: 'file-export' },
    })
    const exportId = (created.body as ExportBody).id
    vi.setSystemTime(Date.now() + 1600)

    const file = await fetch(apiUrl(apiEndpoints.exportEntryFile.path({ exportId })))

    expect(file.status).toBe(HttpStatus.Ok)
    expect(file.headers.get(HttpHeader.ContentType)).toBe(MediaType.PlainText)
    expect(file.headers.get(HttpHeader.ContentDisposition)).toContain('full_project.md')
    expect(await file.text()).toContain('Export: full_project')
  })

  it('rejects a template-format pair that the definition does not offer', async () => {
    const answer = await callApi({
      method: 'POST',
      path: projectPath,
      body: { template: 'full_project', format: 'pdf' },
      headers: { [HttpHeader.IdempotencyKey]: 'invalid-export' },
    })

    expect(answer.status).toBe(HttpStatus.UnprocessableContent)
    expect(answer.body).toMatchObject({ code: 'validation_failed' })
  })
})
