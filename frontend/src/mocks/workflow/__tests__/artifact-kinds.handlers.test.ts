import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import { callApi, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { schemaRejectedCases } from './artifact-kinds.handlers.data'

describe('the artifact kind handlers', () => {
  it('list no kind in the empty scenario', async () => {
    openPage('/?mock-artifact-kinds=empty')

    const answer = await callApi({
      method: 'GET',
      path: apiEndpoints.artifactKinds.path(),
    })

    expect(answer.body).toMatchObject({ artifact_kinds: [] })
  })

  it('serve the content schema of a kind at the version of the definition', async () => {
    const answer = await callApi({
      method: 'GET',
      path: apiEndpoints.contentSchema.path({ kind: 'persona', version: '1' }),
    })

    expect(answer.body).toMatchObject({ title: 'Interviewee' })
  })

  it('serve the kinds of the one workflow version', async () => {
    const answer = await callApi({
      method: 'GET',
      path: `${apiEndpoints.artifactKinds.path()}?workflow_version=1`,
    })

    expect(answer.body).toMatchObject({ workflow_version: 1 })
  })

  it('let a content schema be kept for ever, and the kinds of the current version not', async () => {
    const schema = await callApi({
      method: 'GET',
      path: apiEndpoints.contentSchema.path({ kind: 'persona', version: '1' }),
    })
    const kinds = await callApi({ method: 'GET', path: apiEndpoints.artifactKinds.path() })

    expect(schema.headers.get(HttpHeader.CacheControl)).toContain('immutable')
    expect(kinds.headers.get(HttpHeader.CacheControl)).toBeNull()
  })

  itRejectsRequests(schemaRejectedCases)
})
