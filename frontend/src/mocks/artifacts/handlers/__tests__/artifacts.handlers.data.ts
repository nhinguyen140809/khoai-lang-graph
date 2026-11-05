import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { projectIds } from '../../../shared/db'
import { artifactFixtureByKind } from '../../fixtures/artifacts.fixtures'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
const specification = artifactFixtureByKind(projectIds.mentor, 'requirement_specification')
const artifactPath = apiEndpoints.artifact.path({ artifactId: analysis.id })
const versionHeader = { [HttpHeader.IfMatch]: String(analysis.version) }

/** A request the handlers refuse, and the status and code of the answer. */
export const artifactRejectedCases: RejectedRequestCase[] = [
  {
    name: 'refuses a read of an unknown artifact',
    method: 'GET',
    path: apiEndpoints.artifact.path({ artifactId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the artifacts of an unknown project',
    method: 'GET',
    path: apiEndpoints.projectArtifacts.path({ projectId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of a version that never existed',
    method: 'GET',
    path: `${artifactPath}?version=9`,
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a change without the version it is based on',
    method: 'PATCH',
    path: artifactPath,
    body: { title: 'Analysis' },
    status: HttpStatus.Conflict,
    answer: { code: 'version_conflict' },
  },
  {
    name: 'refuses a change based on an old version',
    method: 'PATCH',
    path: artifactPath,
    body: { title: 'Analysis' },
    headers: { [HttpHeader.IfMatch]: '1' },
    status: HttpStatus.Conflict,
    answer: { code: 'version_conflict' },
  },
  {
    name: 'refuses a change while a run is running',
    page: '/?mock-run-status=running',
    method: 'PATCH',
    path: artifactPath,
    body: { title: 'Analysis' },
    headers: versionHeader,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a change when the run has ended',
    page: '/?mock-run-status=done',
    method: 'PATCH',
    path: artifactPath,
    body: { title: 'Analysis' },
    headers: versionHeader,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a change of an artifact outside the review',
    method: 'PATCH',
    path: apiEndpoints.artifact.path({ artifactId: specification.id }),
    body: { title: 'Specification' },
    headers: { [HttpHeader.IfMatch]: String(specification.version) },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a blank title',
    method: 'PATCH',
    path: artifactPath,
    body: { title: ' ' },
    headers: versionHeader,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a review status that does not exist',
    method: 'PATCH',
    path: artifactPath,
    body: { review_status: 'done' },
    headers: versionHeader,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a content that breaks the schema',
    method: 'PATCH',
    path: artifactPath,
    body: { content: { key_findings: null } },
    headers: versionHeader,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a restore of a version that never existed',
    method: 'POST',
    path: `${artifactPath}/restore`,
    body: { version: 9 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a restore while a run is running',
    page: '/?mock-run-status=running',
    method: 'POST',
    path: `${artifactPath}/restore`,
    body: { version: 1 },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a restore when the run has ended',
    page: '/?mock-run-status=done',
    method: 'POST',
    path: `${artifactPath}/restore`,
    body: { version: 1 },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a read of the versions of an artifact when the scenario answers an error',
    page: '/?mock-revisions=error',
    method: 'GET',
    path: `${artifactPath}/revisions`,
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'refuses a read of the versions of an unknown artifact',
    method: 'GET',
    path: apiEndpoints.artifactRevisions.path({ artifactId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
]

/** A scenario of the page, the path it changes, and the status it answers with. */
export const scenarioCases = [
  {
    name: 'refuses an error',
    page: '/?mock-artifacts=error',
    path: apiEndpoints.projectArtifacts.path({ projectId: projectIds.mentor }),
    status: HttpStatus.InternalServerError,
  },
  {
    name: 'refuses an error of one artifact',
    page: '/?mock-artifact=error',
    path: artifactPath,
    status: HttpStatus.InternalServerError,
  },
  {
    name: 'refuses an error of the artifact kinds',
    page: '/?mock-artifact-kinds=error',
    path: apiEndpoints.artifactKinds.path(),
    status: HttpStatus.InternalServerError,
  },
]

export { analysis, versionHeader }
