import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { pathParam, readBodyFields } from '../../shared/http/request'
import { created, invalidState, noContent, validationFailed } from '../../shared/http/response'
import { answerScenario } from '../../shared/scenario'
import {
  addItem,
  changeItem,
  moveItem,
  recordArtifactChange,
  renumberChildren,
} from '../artifacts.changes'
import {
  childrenOf,
  findArtifact,
  findItem,
  findItemWithDeleted,
  itemRevisions,
} from '../artifacts.lookup'
import {
  artifactNotFound,
  invalidRestoreVersion,
  itemNotFound,
  refuseChange,
  refuseOutsideReview,
} from '../artifacts.problems'
import {
  validateItemChange,
  validateItemMove,
  validateItemReorder,
  validateNewItem,
} from '../artifacts.validators'

/** The endpoints that change items. */
export const itemEditHandlers = [
  http.post(apiEndpoints.artifactItems.pattern, async ({ params, request }) => {
    await answerScenario('create-item')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const refused = refuseOutsideReview(artifact.project_id, artifact.id)
    if (refused !== null) return refused
    const read = validateNewItem(artifact, await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    const item = addItem(artifact, read.item)
    recordArtifactChange(artifact.id, 'user_edit')
    return created(findItem(item.id), apiEndpoints.item.path({ itemId: item.id }))
  }),

  http.post(apiEndpoints.artifactItemsReorder.pattern, async ({ params, request }) => {
    await answerScenario('reorder-items')
    const artifact = findArtifact(pathParam(params, 'artifactId'))
    if (artifact === undefined) return artifactNotFound()
    const refused = refuseOutsideReview(artifact.project_id, artifact.id)
    if (refused !== null) return refused
    const read = validateItemReorder(artifact, await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    renumberChildren(read.ordered)
    recordArtifactChange(artifact.id, 'user_edit')
    return noContent()
  }),

  http.patch(apiEndpoints.item.pattern, async ({ params, request }) => {
    await answerScenario('update-item')
    const item = findItem(pathParam(params, 'itemId'))
    if (item === undefined) return itemNotFound()
    const refused = refuseChange(request, item, item.artifact_id)
    if (refused !== null) return refused
    const read = validateItemChange(item, await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    changeItem(item, read.change, 'user_edit')
    recordArtifactChange(item.artifact_id, 'user_edit')
    return HttpResponse.json(findItem(item.id))
  }),

  http.delete(apiEndpoints.item.pattern, async ({ params }) => {
    await answerScenario('delete-item')
    const item = findItem(pathParam(params, 'itemId'))
    if (item === undefined) return itemNotFound()
    const refused = refuseOutsideReview(item.project_id, item.artifact_id)
    if (refused !== null) return refused
    if (childrenOf(item.artifact_id, item.id).length > 0) {
      return invalidState('A section that still holds items cannot be deleted.')
    }
    changeItem(item, { deleted: true }, 'deleted')
    recordArtifactChange(item.artifact_id, 'user_edit')
    return noContent()
  }),

  http.post(apiEndpoints.itemMove.pattern, async ({ params, request }) => {
    await answerScenario('move-item')
    const item = findItem(pathParam(params, 'itemId'))
    if (item === undefined) return itemNotFound()
    const refused = refuseOutsideReview(item.project_id, item.artifact_id)
    if (refused !== null) return refused
    const read = validateItemMove(item, await readBodyFields(request))
    if ('problems' in read) return validationFailed(read.problems)
    moveItem(item, read.parentItemId, read.position)
    recordArtifactChange(item.artifact_id, 'user_edit')
    return HttpResponse.json(findItem(item.id))
  }),

  http.post(apiEndpoints.itemRestore.pattern, async ({ params, request }) => {
    await answerScenario('restore-item')
    const item = findItemWithDeleted(pathParam(params, 'itemId'))
    if (item === undefined) return itemNotFound()
    const refused = refuseOutsideReview(item.project_id, item.artifact_id)
    if (refused !== null) return refused
    const { version } = await readBodyFields(request)
    const target = itemRevisions(item).find((entry) => entry.version === version)
    if (target === undefined) return invalidRestoreVersion()
    changeItem(item, { content: target.content, deleted: false }, 'restored')
    recordArtifactChange(item.artifact_id, 'user_edit')
    return HttpResponse.json(findItem(item.id))
  }),
]
