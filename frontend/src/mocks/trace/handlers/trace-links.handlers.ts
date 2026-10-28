import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { findProject } from '../../projects/projects.lookup'
import { projectNotFound } from '../../projects/projects.problems'
import { hasMatchingParam, pathParam, queryOf, readBodyFields } from '../../shared/http/request'
import {
  created,
  emptyPage,
  noContent,
  paginate,
  validationFailed,
} from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import { findTraceLink, projectTraceLinks } from '../lookup/trace-links.lookup'
import { addTraceLink, removeTraceLink } from '../trace-links.changes'
import { traceLinkNotFound } from '../trace-links.problems'
import { validateNewTraceLink } from '../validators/trace-links.validators'

/** The endpoints of the trace links of a project. */
export const traceLinkHandlers = [
  http.get(apiEndpoints.projectTraceLinks.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('trace-links')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const query = queryOf(request)
    const found = projectTraceLinks(projectId).filter(
      (link) =>
        hasMatchingParam(query, 'link_type', link.link_type) &&
        hasMatchingParam(query, 'source_item_id', link.source_item_id) &&
        hasMatchingParam(query, 'target_item_id', link.target_item_id),
    )
    return HttpResponse.json(paginate(found, request))
  }),

  http.post(apiEndpoints.projectTraceLinks.pattern, async ({ params, request }) => {
    await answerScenario('create-trace-link')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    const read = validateNewTraceLink(projectId, await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const link = addTraceLink(read.link)
    return created(link)
  }),

  http.delete(apiEndpoints.traceLink.pattern, async ({ params }) => {
    await answerScenario('delete-trace-link')
    const link = findTraceLink(pathParam(params, 'linkId'))
    if (link === undefined) return traceLinkNotFound()
    removeTraceLink(link.id)
    return noContent()
  }),
]
