import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import {
  findArtifact,
  findItemWithDeleted,
  outlineOfArtifact,
} from '../../artifacts/artifacts.lookup'
import { artifactNotFound, itemNotFound } from '../../artifacts/artifacts.problems'
import { pathParam, queryOf } from '../../shared/http/request'
import { validationFailed } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { itemTraceDepth } from '../chains.constants'
import { traceFrom } from '../lookup/chains.lookup'
import { validateTraceQuery } from '../validators/chains.validators'

// The answer to a request for a trace from some items: the direction and the depth that its query
// names, or the problems of the query.
function answerTrace(request: Request, startIds: string[], defaultDepth: number | null) {
  const read = validateTraceQuery(queryOf(request), defaultDepth)
  if ('problems' in read) return validationFailed(read.problems)
  return HttpResponse.json(traceFrom(startIds, read.direction, read.depth))
}

/** The endpoints of the trace of an item and of an artifact. */
export const chainHandlers = [
  http.get(apiEndpoints.itemTrace.pattern, async ({ params, request }) => {
    await answerScenario('traces')
    const item = findItemWithDeleted(pathParam(params, 'itemId'))
    if (item === undefined) return itemNotFound()
    return answerTrace(request, [item.id], itemTraceDepth)
  }),

  // The trace of an artifact starts at all its items and goes as far as the links lead, unless the
  // request names a depth.
  http.get(apiEndpoints.artifactTrace.pattern, async ({ params, request }) => {
    await answerScenario('traces')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const startIds = outlineOfArtifact(artifact.id).map(({ id }) => id)
    return answerTrace(request, startIds, null)
  }),
]
