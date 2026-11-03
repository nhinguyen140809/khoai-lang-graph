import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import {
  type CreateTraceLinkBody,
  type TraceLink,
  type TraceLinkFilters,
  traceLinkSchema,
} from '../types/trace-links.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** One page of the current links of a project, without the removed ones. */
export function listProjectTraceLinks(
  projectId: string,
  cursor: string | null,
  limit: number,
  filters: TraceLinkFilters = {},
): Promise<ListPage<TraceLink>> {
  const path = pathWithQuery(apiEndpoints.projectTraceLinks.path({ projectId }), {
    link_type: filters.linkType,
    source_item_id: filters.sourceItemId,
    target_item_id: filters.targetItemId,
  })
  return fetchPage(path, traceLinkSchema, { limit, cursor, action: 'load the links' })
}

/** Makes a link by hand; the pair of item kinds must be allowed for the type of the link. */
export function createTraceLink(projectId: string, link: CreateTraceLinkBody): Promise<TraceLink> {
  return apiRequest(apiEndpoints.projectTraceLinks.path({ projectId }), traceLinkSchema, {
    action: 'add the link',
    method: HttpMethod.Post,
    body: link,
  })
}

/** Removes a link; it is left out of the lists and the traces from then on. */
export function deleteTraceLink(linkId: string): Promise<void> {
  return apiCommand(apiEndpoints.traceLink.path({ linkId }), {
    action: 'remove the link',
    method: HttpMethod.Delete,
  })
}
