import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'

import { requestedVersion } from '../shared/http/request'
import { answerScenario, pageUrlParam } from '../shared/scenario'
import { keptForeverCacheControl } from './workflow.constants'
import {
  assistanceDefinitionFixture,
  workflowDefinitionFixture,
  workflowDefinitionWithEveryParameterType,
} from './workflow.fixtures'
import { definitionVersionNotFound } from './workflow.problems'

export const workflowHandlers = [
  http.get(apiEndpoints.workflowDefinition.pattern, async ({ request }) => {
    await answerScenario('workflow')
    const name = new URL(request.url).searchParams.get('name')
    const version = requestedVersion(request)
    if (name === assistanceDefinitionFixture.name) {
      return version === null || version === assistanceDefinitionFixture.version
        ? HttpResponse.json(assistanceDefinitionFixture, {
            headers: { [HttpHeader.CacheControl]: keptForeverCacheControl },
          })
        : definitionVersionNotFound()
    }
    if (name !== null && name !== workflowDefinitionFixture.name) return definitionVersionNotFound()
    if (version === null) {
      return HttpResponse.json(
        pageUrlParam('mock-run-parameters') === 'all-types'
          ? workflowDefinitionWithEveryParameterType
          : workflowDefinitionFixture,
      )
    }
    return version === workflowDefinitionFixture.version
      ? HttpResponse.json(workflowDefinitionFixture, {
          headers: { [HttpHeader.CacheControl]: keptForeverCacheControl },
        })
      : definitionVersionNotFound()
  }),
]
