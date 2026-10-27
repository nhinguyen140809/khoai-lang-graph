import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'

import { pathParam, requestedVersion } from '../shared/http/request'
import { answerScenario } from '../shared/scenario'
import { artifactKindFixtures, findKind } from './artifact-kinds.fixtures'
import { contentSchemaNotFound } from './artifact-kinds.problems'
import { keptForeverCacheControl } from './workflow.constants'
import { definitionVersionNotFound } from './workflow.problems'

export const artifactKindHandlers = [
  // The kinds of the current definition, or of the version that `?workflow_version=` names; the
  // mock holds the one version.
  http.get(apiEndpoints.artifactKinds.pattern, async ({ request }) => {
    const scenario = await answerScenario('artifact-kinds')
    const version = requestedVersion(request, 'workflow_version')
    if (version !== null && version !== artifactKindFixtures.workflow_version) {
      return definitionVersionNotFound()
    }
    return HttpResponse.json(
      scenario === 'empty' ? { ...artifactKindFixtures, artifact_kinds: [] } : artifactKindFixtures,
    )
  }),

  // A kind has the one version that the definition gives it, and a schema never changes.
  http.get(apiEndpoints.contentSchema.pattern, ({ params }) => {
    const found = findKind(pathParam(params, 'kind'))
    return found === undefined || String(found.schema_version) !== pathParam(params, 'version')
      ? contentSchemaNotFound()
      : HttpResponse.json(found.schema, {
          headers: { [HttpHeader.CacheControl]: keptForeverCacheControl },
        })
  }),
]
