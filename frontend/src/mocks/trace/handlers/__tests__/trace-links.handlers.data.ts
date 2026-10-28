import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '../../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../../shared/db'

export const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const specification = artifactFixtureByKind(projectId, 'requirement_specification')
const linksPath = apiEndpoints.projectTraceLinks.path({ projectId })
const itemTracePath = apiEndpoints.itemTrace.path({ itemId: requirement.id })
const artifactTracePath = apiEndpoints.artifactTrace.path({ artifactId: specification.id })
const missingProject = { projectId: 'missing' }

/** A request the handlers refuse, and the status and the code of the answer. */
export const traceLinkRejectedCases: RejectedRequestCase[] = [
  {
    name: 'refuses a read of the links of an unknown project',
    method: 'GET',
    path: apiEndpoints.projectTraceLinks.path(missingProject),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a link in an unknown project',
    method: 'POST',
    path: apiEndpoints.projectTraceLinks.path(missingProject),
    body: {},
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a link with no field',
    method: 'POST',
    path: linksPath,
    body: {},
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses the removal of an unknown link',
    method: 'DELETE',
    path: apiEndpoints.traceLink.path({ linkId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the trace of an unknown item',
    method: 'GET',
    path: apiEndpoints.itemTrace.path({ itemId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the trace of an unknown artifact',
    method: 'GET',
    path: apiEndpoints.artifactTrace.path({ artifactId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a trace in a direction it does not know',
    method: 'GET',
    path: `${itemTracePath}?direction=sideways`,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a trace of an artifact to a depth that is not a number',
    method: 'GET',
    path: `${artifactTracePath}?depth=deep`,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a read of the matrix of an unknown project',
    method: 'GET',
    path: apiEndpoints.traceabilityMatrix.path(missingProject),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the coverage of an unknown project',
    method: 'GET',
    path: apiEndpoints.traceabilityCoverage.path(missingProject),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the links in the error scenario',
    page: '/?mock-trace-links=error',
    method: 'GET',
    path: linksPath,
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]

/** The path of the matrix and of the links, for the tests of the scenarios that empty them. */
export const matrixPath = apiEndpoints.traceabilityMatrix.path({ projectId })
export const emptyLinksPath = linksPath
