import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod } from '@/shared/api/http'
import { callApi } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { definitionRejectedCases } from './workflow.handlers.data'

// The definition file that the mock copies, read from the root of the repository.
const documented: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), '../docs/workflow/requirements_engineering.v1.json'), 'utf8'),
)

describe('the workflow handlers', () => {
  it('serve the definition of the docs', async () => {
    const answer = await callApi({
      method: HttpMethod.Get,
      path: apiEndpoints.workflowDefinition.path(),
    })

    expect(answer.body).toEqual(documented)
  })

  it('let a version be kept for ever, and the current definition not', async () => {
    const path = apiEndpoints.workflowDefinition.path()
    const version = await callApi({ method: HttpMethod.Get, path: `${path}?version=1` })
    const current = await callApi({ method: HttpMethod.Get, path })

    expect(version.headers.get(HttpHeader.CacheControl)).toContain('immutable')
    expect(current.headers.get(HttpHeader.CacheControl)).toBeNull()
  })

  itRejectsRequests(definitionRejectedCases)
})
