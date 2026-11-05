import { http, HttpResponse } from 'msw'

import { itemHierarchy } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { toNested } from '@/shared/lib/hierarchy'
import { hasTextPart } from '@/shared/lib/text'

import { findProject } from '../../projects/projects.lookup'
import { projectNotFound } from '../../projects/projects.problems'
import { hasMatchingParam, pathParam, queryOf, requestedVersion } from '../../shared/http/request'
import { emptyPage, paginate } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import {
  allItems,
  findArtifact,
  findItem,
  findItemWithDeleted,
  itemAtVersion,
  itemRevisions,
  outlineOfArtifact,
} from '../artifacts.lookup'
import { artifactNotFound, itemNotFound, versionNotFound } from '../artifacts.problems'

/** The endpoints that read items. */
export const itemHandlers = [
  http.get(apiEndpoints.artifactItems.pattern, async ({ params, request }) => {
    await answerScenario('artifact')
    const artifactId = pathParam(params, 'artifactId')
    if (findArtifact(artifactId) === undefined) return artifactNotFound()
    const query = queryOf(request)
    const version = requestedVersion(request)
    const items = outlineOfArtifact(artifactId)
      .filter((item) => hasMatchingParam(query, 'kind', item.kind))
      .filter((item) => hasMatchingParam(query, 'review_status', item.review_status))
      .filter((item) => hasMatchingParam(query, 'parent_item_id', item.parent_item_id))
      .flatMap((item) => itemAtVersion(item, version) ?? [])
    if (query.get('shape') === 'tree') {
      return HttpResponse.json(paginate(toNested(items, itemHierarchy), request))
    }
    return HttpResponse.json(paginate(items, request))
  }),

  http.get(apiEndpoints.projectItems.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('items')
    const projectId = pathParam(params, 'projectId')
    if (findProject(projectId) === undefined) return projectNotFound()
    if (scenario === 'empty') return HttpResponse.json(emptyPage)
    const query = queryOf(request)
    const needle = query.get('q') ?? ''
    const items = allItems()
      .filter((item) => item.project_id === projectId)
      .filter((item) => hasMatchingParam(query, 'kind', item.kind))
      .filter((item) => hasMatchingParam(query, 'review_status', item.review_status))
      .filter(
        (item) =>
          hasMatchingParam(query, 'run_id', item.created_by.run_id) ||
          hasMatchingParam(query, 'run_id', item.updated_by.run_id),
      )
      .filter(
        (item) =>
          hasTextPart(item.key, needle) || hasTextPart(JSON.stringify(item.content), needle),
      )
      .toSorted((a, b) => a.key.localeCompare(b.key))
    return HttpResponse.json(paginate(items, request))
  }),

  http.get(apiEndpoints.item.pattern, async ({ params, request }) => {
    const scenario = await answerScenario('item')
    if (scenario === 'empty') return itemNotFound()
    const version = requestedVersion(request)
    // A deleted item stays readable at its versions. One that is not deleted keeps its place in the
    // outline, so its number is the same at every version.
    const item =
      findItem(pathParam(params, 'itemId')) ??
      (version === null ? undefined : findItemWithDeleted(pathParam(params, 'itemId')))
    if (item === undefined) return itemNotFound()
    const found = itemAtVersion(item, version)
    return found === undefined ? versionNotFound() : HttpResponse.json(found)
  }),

  http.get(apiEndpoints.itemRevisions.pattern, async ({ params, request }) => {
    await answerScenario('item')
    await answerScenario('revisions')
    const item = findItemWithDeleted(pathParam(params, 'itemId'))
    return item === undefined
      ? itemNotFound()
      : HttpResponse.json(paginate(itemRevisions(item), request))
  }),
]
