import { describe, expect, it } from 'vitest'

import { itSendsRequests, itThrowsApiErrors } from '@/test/suites'

import { listModels } from '../models.api'
import { apiErrorCases, sentRequestCases } from './models.api.data'

describe('models api', () => {
  it('reads the six models of the catalog in the order of their ids', async () => {
    const models = await listModels()

    const ids = models.map(({ model_id: modelId }) => modelId)
    expect(ids).toHaveLength(6)
    expect(ids[0]).toBe('anthropic:claude-haiku-5')
    expect(ids).toEqual(ids.toSorted())
  })

  itSendsRequests(sentRequestCases)

  itThrowsApiErrors(apiErrorCases)
})
