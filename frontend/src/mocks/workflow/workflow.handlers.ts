import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'

import { requestedVersion } from '../shared/http/request'
import { answerScenario } from '../shared/scenario'
import { keptForeverCacheControl } from './workflow.constants'
import { workflowDefinitionFixture } from './workflow.fixtures'
import { definitionVersionNotFound } from './workflow.problems'

export const workflowHandlers = [
  http.get(apiEndpoints.workflowDefinition.pattern, async ({ request }) => {
    await answerScenario('workflow')
    const version = requestedVersion(request)
    if (version === null) return HttpResponse.json(workflowDefinitionFixture)
    return version === workflowDefinitionFixture.version
      ? HttpResponse.json(workflowDefinitionFixture, {
          headers: { [HttpHeader.CacheControl]: keptForeverCacheControl },
        })
      : definitionVersionNotFound()
  }),
]
