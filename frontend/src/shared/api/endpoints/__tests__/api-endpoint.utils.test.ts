import { describe, expect, it } from 'vitest'

import { apiEndpoint } from '../api-endpoint.utils'
import { apiEndpoints, publicApiPaths } from '../api-endpoints.constants'

describe('apiEndpoints', () => {
  it('give the pattern and the path of an endpoint without params', () => {
    expect(apiEndpoints.projects.pattern).toBe('/api/v1/projects')
    expect(apiEndpoints.projects.path()).toBe('/api/v1/projects')
  })

  it('give the pattern with its params, and the path with their values', () => {
    expect(apiEndpoints.threadMessages.pattern).toBe('/api/v1/threads/:threadId/messages')
    expect(apiEndpoints.threadMessages.path({ threadId: 't1' })).toBe('/api/v1/threads/t1/messages')
  })

  it('give the path of an endpoint with several params', () => {
    expect(apiEndpoint('/things/:kind/:version').path({ kind: 'persona', version: 2 })).toBe(
      '/api/v1/things/persona/2',
    )
  })

  it('encode each value as one path segment', () => {
    expect(apiEndpoints.project.path({ projectId: 'a b/c' })).toBe('/api/v1/projects/a%20b%2Fc')
  })

  it('list the paths that answer without a session', () => {
    expect(publicApiPaths).toEqual([
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/health',
    ])
  })
})
