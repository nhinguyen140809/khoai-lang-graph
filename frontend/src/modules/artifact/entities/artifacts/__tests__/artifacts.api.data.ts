import { http, HttpResponse } from 'msw'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import {
  getArtifact,
  listProjectArtifacts,
  restoreArtifact,
  updateArtifact,
} from '../artifacts.api'

const projectId = projectIds.mentor
/** An artifact at version 2 of the mentor project. */
const plan = artifactFixtureByKind(projectId, 'elicitation_plan')
const artifactPath = apiEndpoints.artifact.path({ artifactId: plan.id })

/** A call of the artifacts API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists the artifacts of a project in the largest page',
    call: () => listProjectArtifacts(projectId),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectArtifacts.path({ projectId })}?limit=200`,
      body: null,
    },
  },
  {
    name: 'lists the artifacts that match the filters',
    call: () =>
      listProjectArtifacts(projectId, { kind: 'persona_catalog', reviewStatus: 'approved' }),
    request: {
      method: 'GET',
      path: `${apiEndpoints.projectArtifacts.path({ projectId })}?kind=persona_catalog&review_status=approved&limit=200`,
      body: null,
    },
  },
  {
    name: 'reads an artifact',
    call: () => getArtifact(plan.id),
    request: { method: 'GET', path: artifactPath, body: null },
  },
  {
    name: 'reads an artifact at a version',
    call: () => getArtifact(plan.id, 1),
    request: { method: 'GET', path: `${artifactPath}?version=1`, body: null },
  },
  {
    name: 'changes the fields that are given',
    call: () => updateArtifact(plan.id, plan.version, { title: 'Plan', summary: null }),
    request: {
      method: 'PATCH',
      path: artifactPath,
      body: { title: 'Plan', summary: null },
    },
  },
  {
    name: 'changes the review status of an artifact',
    call: () => updateArtifact(plan.id, plan.version, { review_status: 'rejected' }),
    request: { method: 'PATCH', path: artifactPath, body: { review_status: 'rejected' } },
  },
  {
    name: 'restores a version of an artifact',
    call: () => restoreArtifact(plan.id, 1),
    request: { method: 'POST', path: `${artifactPath}/restore`, body: { version: 1 } },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the artifacts',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.projectArtifacts.pattern),
    call: () => listProjectArtifacts(projectId),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the artifacts (HTTP 500)',
    },
  },
  {
    name: 'a change based on an old version',
    refuse: () =>
      http.patch(apiEndpoints.artifact.pattern, () =>
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
    call: () => updateArtifact(plan.id, 1, { title: 'Plan' }),
    error: {
      status: HttpStatus.Conflict,
      code: 'version_conflict',
      message: 'Failed to save the artifact (HTTP 409): Old.',
    },
  },
]

export { plan }
