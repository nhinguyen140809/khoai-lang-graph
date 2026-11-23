import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod, HttpStatus } from '@/shared/api/http'
import { fetchApi, getApiItems } from '@/test/msw'

import { projectIds } from '../../shared/db'

const path = apiEndpoints.projectSources.path({ projectId: projectIds.mentor })

const boundary = 'source-boundary'

/** Uploads a file of this name and size as the multipart form that a browser sends. */
function upload(name: string, size = 20) {
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${name}"`,
    'Content-Type: text/plain',
    '',
    'x'.repeat(size),
    `--${boundary}--`,
    '',
  ].join('\r\n')
  return fetchApi(path, {
    method: HttpMethod.Post,
    headers: { [HttpHeader.ContentType]: `multipart/form-data; boundary=${boundary}` },
    body,
  })
}

describe('the source handlers', () => {
  it('store an upload and list it, newest first', async () => {
    const answer = await upload('brief.md')

    expect(answer.status).toBe(HttpStatus.Created)
    expect(answer.body).toMatchObject({
      title: 'brief',
      filename: 'brief.md',
      format: 'md',
      latest_version: 1,
    })
    expect(answer.headers.get(HttpHeader.Location)).toContain((answer.body as { id: string }).id)
    const items = await getApiItems<{ id: string }>(path)
    expect(items[0]?.id).toBe((answer.body as { id: string }).id)
  })

  it('answer 422 for a format that is not read and for a file over the limit', async () => {
    const unsupported = await upload('scan.pdf')
    const tooLarge = await upload('dump.json', 10 * 1024 * 1024 + 1)

    expect(unsupported.status).toBe(HttpStatus.UnprocessableContent)
    expect(unsupported.body).toMatchObject({ code: 'unsupported_format' })
    expect(tooLarge.status).toBe(HttpStatus.UnprocessableContent)
    expect(tooLarge.body).toMatchObject({ code: 'too_large' })
  })
})
