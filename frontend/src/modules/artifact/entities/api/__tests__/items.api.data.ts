import { http, HttpResponse } from 'msw'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
  itemFixtures,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { emptyResponse } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import type { CreateItemBody } from '../../types/items.types'
import {
  createItem,
  deleteItem,
  getItem,
  listArtifactItems,
  listItemRevisions,
  listNestedArtifactItems,
  listProjectItems,
  moveItem,
  reorderItems,
  restoreItem,
  updateItem,
} from '../items.api'

const projectId = projectIds.mentor
export const specification = artifactFixtureByKind(projectId, 'requirement_specification')
/** A requirement of the specification, in a section. */
export const requirement = itemFixtureByKey(projectId, 'REQ-001')
/** A section of the specification that holds requirements. */
const section = itemFixtureByKey(projectId, 'SEC-005')
/** The ids of the items directly under an item, in order. */
function itemsUnder(parentId: string): string[] {
  return itemFixtures
    .filter(({ parent_item_id }) => parent_item_id === parentId)
    .map(({ id }) => id)
}

/** The content of a requirement to add to the section. */
const newRequirementContent = {
  title: 'Rate a session',
  statement: 'The system shall let a student rate a session.',
  type: 'functional',
  quality_category: null,
  priority: 'could',
  rationale: 'Asked for in the interviews.',
  acceptance_criteria: [],
  fit_criterion: null,
  verification_method: 'test',
}

/** A requirement to add under the section. */
export const newRequirement: CreateItemBody = {
  kind: 'spec_requirement',
  content: newRequirementContent,
  parent_item_id: section.id,
}

const artifactItemsPath = apiEndpoints.artifactItems.path({ artifactId: specification.id })
const itemPath = apiEndpoints.item.path({ itemId: requirement.id })

/** A call of the items API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists a page of the items of an artifact',
    call: () => listArtifactItems(specification.id, null, 200),
    request: { method: 'GET', path: `${artifactItemsPath}?limit=200`, body: null },
  },
  {
    name: 'lists the nested items of an artifact',
    call: () => listNestedArtifactItems(specification.id, null, 50),
    request: { method: 'GET', path: `${artifactItemsPath}?shape=tree&limit=50`, body: null },
  },
  {
    name: 'lists the next page of the items of an artifact',
    call: () => listArtifactItems(specification.id, '2', 2),
    request: { method: 'GET', path: `${artifactItemsPath}?limit=2&cursor=2`, body: null },
  },
  {
    name: 'lists the items of an artifact that match every filter, at a version',
    call: () =>
      listArtifactItems(specification.id, null, 50, {
        kind: 'spec_requirement',
        reviewStatus: 'approved',
        parentItemId: 'section-1',
        version: 2,
      }),
    request: {
      method: 'GET',
      path: `${artifactItemsPath}?kind=spec_requirement&review_status=approved&parent_item_id=section-1&version=2&limit=50`,
      body: null,
    },
  },
  {
    name: 'lists the items of a project',
    call: () => listProjectItems(projectId, null, 50),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectItems.path({ projectId })}?limit=50`,
      body: null,
    },
  },
  {
    name: 'lists the items that match every filter',
    call: () =>
      listProjectItems(projectId, null, 50, {
        kind: 'spec_requirement',
        reviewStatus: 'approved',
        runId: 'run-1',
        text: 'mentor',
      }),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectItems.path({ projectId })}?kind=spec_requirement&review_status=approved&run_id=run-1&q=mentor&limit=50`,
      body: null,
    },
  },
  {
    name: 'reads an item',
    call: () => getItem(requirement.id),
    request: { method: 'GET', path: itemPath, body: null },
  },
  {
    name: 'reads an item at a version',
    call: () => getItem(requirement.id, 1),
    request: { method: 'GET', path: `${itemPath}?version=1`, body: null },
  },
  {
    name: 'makes an item under a section',
    call: () => createItem(specification.id, newRequirement),
    request: {
      method: 'POST',
      path: artifactItemsPath,
      body: {
        kind: 'spec_requirement',
        content: newRequirementContent,
        parent_item_id: section.id,
      },
    },
  },
  {
    name: 'changes the content and the review status of an item',
    call: () =>
      updateItem(requirement.id, requirement.version, {
        content: { title: 'Find mentors' },
        review_status: 'rejected',
      }),
    request: {
      method: 'PATCH',
      path: itemPath,
      body: { content: { title: 'Find mentors' }, review_status: 'rejected' },
    },
  },
  {
    name: 'deletes an item',
    call: () => deleteItem(requirement.id),
    request: { method: 'DELETE', path: itemPath, body: null },
  },
  {
    name: 'puts the items under a section in a new order',
    call: () => reorderItems(specification.id, section.id, [...itemsUnder(section.id)].reverse()),
    request: {
      method: 'POST',
      path: `${artifactItemsPath}/reorder`,
      body: { parent_item_id: section.id, ids: [...itemsUnder(section.id)].reverse() },
    },
  },
  {
    name: 'moves an item to the top level',
    call: () => moveItem(requirement.id, { parent_item_id: null, position: 1 }),
    request: {
      method: 'POST',
      path: `${itemPath}/move`,
      body: { parent_item_id: null, position: 1 },
    },
  },
  {
    name: 'lists a page of the versions of an item',
    call: () => listItemRevisions(requirement.id, null, 50),
    request: { method: 'GET', path: `${itemPath}/revisions?limit=50`, body: null },
  },
  {
    name: 'restores a version of an item',
    call: () => restoreItem(requirement.id, 1),
    request: { method: 'POST', path: `${itemPath}/restore`, body: { version: 1 } },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the items of an artifact',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.artifactItems.pattern),
    call: () => listArtifactItems(specification.id, null, 200),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the items of the artifact (HTTP 500)',
    },
  },
  {
    name: 'a change of an item that moved on',
    refuse: () =>
      http.patch(apiEndpoints.item.pattern, () =>
        HttpResponse.json(
          {
            title: 'Version conflict',
            status: HttpStatus.Conflict,
            code: 'version_conflict',
            detail: 'Old.',
          },
          { status: HttpStatus.Conflict },
        ),
      ),
    call: () => updateItem(requirement.id, 1, { content: { title: 'x' } }),
    error: {
      status: HttpStatus.Conflict,
      code: 'version_conflict',
      message: 'Failed to save the item (HTTP 409): Old.',
    },
  },
  {
    name: 'a deletion of a section that still holds items',
    refuse: () => http.delete(apiEndpoints.item.pattern, () => emptyResponse(HttpStatus.Conflict)),
    call: () => deleteItem(section.id),
    error: {
      status: HttpStatus.Conflict,
      code: null,
      message: 'Failed to delete the item (HTTP 409)',
    },
  },
]
