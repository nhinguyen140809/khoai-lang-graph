import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { assertPresent } from '@/shared/lib/guards'
import type { RejectedRequestCase } from '@/test/suites'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '../../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../../shared/db'
import { traceLinkFixtures } from '../../fixtures/trace-links.fixtures'

export const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const secondRequirement = itemFixtureByKey(projectId, 'REQ-002')
const analyzed = itemFixtureByKey(projectId, 'AR-001')
const raw = itemFixtureByKey(projectId, 'RAW-002')
const mentorPersona = itemFixtureByKey(projectId, 'PER-002')
const userStory = itemFixtureByKey(projectId, 'US-001')
const specification = artifactFixtureByKind(projectId, 'requirement_specification')
const linksPath = apiEndpoints.projectTraceLinks.path({ projectId })
const itemTracePath = apiEndpoints.itemTrace.path({ itemId: requirement.id })
const artifactTracePath = apiEndpoints.artifactTrace.path({ artifactId: specification.id })
const missingProject = { projectId: 'missing' }

/** A link of the fixtures that starts at a user story, whose document is not under review. */
const linkOfUserStory = assertPresent(
  traceLinkFixtures.find(({ source_item_id }) => source_item_id === userStory.id),
  'The fixtures hold a link of the user story',
)

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
    name: 'refuses a link whose fields pass but that the state of the document of its source refuses',
    method: 'POST',
    path: linksPath,
    body: {
      source_item_id: secondRequirement.id,
      target_item_id: requirement.id,
      link_type: 'depends_on',
    },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses the removal of a link whose source is not in a document under review',
    method: 'DELETE',
    path: apiEndpoints.traceLink.path({ linkId: linkOfUserStory.id }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
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
    name: 'refuses a quote on the side of a link type that quotes no words',
    method: 'POST',
    path: linksPath,
    body: {
      source_item_id: raw.id,
      target_item_id: mentorPersona.id,
      link_type: 'stated_by',
      target_quote: 'I never know who is free this week',
    },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a quote whose words are not in the text of its item',
    method: 'POST',
    path: linksPath,
    body: {
      source_item_id: secondRequirement.id,
      target_item_id: analyzed.id,
      link_type: 'derived_from',
      target_quote: 'words that are not there',
    },
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
export const coveragePath = apiEndpoints.traceabilityCoverage.path({ projectId })
export const emptyLinksPath = linksPath
