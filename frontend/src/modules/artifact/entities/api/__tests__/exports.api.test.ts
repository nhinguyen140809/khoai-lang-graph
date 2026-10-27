import { describe, expect, it, vi } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { ApiError } from '@/shared/api/error'
import { HttpStatus } from '@/shared/api/http'
import { itSendsRequests } from '@/test/suites'

import { createExport, getExport, listProjectExports } from '../exports.api'
import { fullProjectAsJson, projectId, sentRequestCases } from './exports.api.data'

describe('exports api', () => {
  it('asks for an export and returns it as pending', async () => {
    const entry = await createExport(projectId, fullProjectAsJson, 'export-key')

    expect(entry).toMatchObject({
      project_id: projectId,
      template: 'full_project',
      format: 'json',
      status: 'pending',
      download_url: null,
    })
  })

  it('lists exports with the next cursor', async () => {
    await createExport(projectId, fullProjectAsJson, 'page-one')
    await createExport(projectId, fullProjectAsJson, 'page-two')
    const first = await listProjectExports(projectId, null, 1)
    const second = await listProjectExports(projectId, first.next_cursor, 1)

    expect(first.items).toHaveLength(1)
    expect(second.items).toHaveLength(1)
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id)
    expect(second.next_cursor).toBeNull()
  })

  it('rejects a format that the template does not offer', async () => {
    await expect(
      createExport(projectId, { template: 'full_project', format: 'pdf' }, 'bad-format'),
    ).rejects.toMatchObject({
      status: HttpStatus.UnprocessableContent,
    })
  })

  it('returns an export after it becomes ready', async () => {
    vi.useFakeTimers()
    const created = await createExport(projectId, fullProjectAsJson, 'ready-key')
    vi.setSystemTime(Date.now() + 1600)

    const ready = await getExport(created.id)

    expect(ready).toMatchObject({
      status: 'ready',
      download_url: apiEndpoints.exportEntryFile.path({ exportId: created.id }),
    })
  })

  itSendsRequests(sentRequestCases)

  it('turns a missing export into an ApiError', async () => {
    const caught: unknown = await getExport('missing').catch((error: unknown) => error)

    expect(caught).toBeInstanceOf(ApiError)
    expect(caught).toMatchObject({ status: HttpStatus.NotFound })
  })
})
