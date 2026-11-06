import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { type Trace, type TraceQuery, traceSchema } from './chains.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

function readTrace(path: string, { direction, depth }: TraceQuery, action: string): Promise<Trace> {
  return apiRequest(pathWithQuery(path, { direction, depth }), traceSchema, { action })
}

/** The chain of one item: what it was built from, what was built from it, or both. */
export function getItemTrace(itemId: string, query: TraceQuery = {}): Promise<Trace> {
  return readTrace(apiEndpoints.itemTrace.path({ itemId }), query, 'load the trace of the item')
}

/** The chains of all the items of an artifact, from the interview to the backlog, in one answer. */
export function getArtifactTrace(artifactId: string, query: TraceQuery = {}): Promise<Trace> {
  return readTrace(
    apiEndpoints.artifactTrace.path({ artifactId }),
    query,
    'load the trace of the artifact',
  )
}
