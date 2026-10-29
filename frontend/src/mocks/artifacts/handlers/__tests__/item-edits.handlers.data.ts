import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { artifactFixtureByKind, itemFixtureByKey } from '../../fixtures/artifacts.fixtures'
import {
  discoverySection,
  itemPath,
  mentorRequirement,
  projectId,
  specificationItems,
} from './items.handlers.data'

const persona = itemFixtureByKey(projectId, 'PER-001')
const transcript = artifactFixtureByKind(projectId, 'interview_transcript')
export const siblingRequirement = itemFixtureByKey(projectId, 'REQ-002')
export const bookingSection = itemFixtureByKey(projectId, 'SEC-005')
const functional = itemFixtureByKey(projectId, 'SEC-003')
export const itemVersion = { [HttpHeader.IfMatch]: String(mentorRequirement.version) }

export const requirementContent = {
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

/** A change the handlers refuse, and the status and code of the answer. */
export const itemEditRejectedCases: RejectedRequestCase[] = [
  {
    name: 'refuses a change without the version it is based on',
    method: 'PATCH',
    path: itemPath,
    body: { content: { title: 'x' } },
    status: HttpStatus.Conflict,
    answer: { code: 'version_conflict' },
  },
  {
    name: 'refuses a change while a run is running',
    page: '/?mock-run-status=running',
    method: 'PATCH',
    path: itemPath,
    body: { content: { title: 'x' } },
    headers: itemVersion,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a content that breaks the schema',
    method: 'PATCH',
    path: itemPath,
    body: { content: { title: 5 } },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a content with a field the schema does not have',
    method: 'PATCH',
    path: itemPath,
    body: { content: { bogus: 1 } },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a value outside the list it takes its values from',
    method: 'PATCH',
    path: apiEndpoints.item.path({ itemId: persona.id }),
    body: { content: { stakeholder_type: 'nobody' } },
    headers: { [HttpHeader.IfMatch]: String(persona.version) },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a message of an interview',
    method: 'POST',
    path: apiEndpoints.artifactItems.path({ artifactId: transcript.id }),
    body: {
      kind: 'interview_message',
      content: { turn: 1, role: 'persona', content: 'x', iteration: 0, topic: null },
    },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a review status that does not exist',
    method: 'PATCH',
    path: itemPath,
    body: { review_status: 'done' },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item of a kind that the artifact does not hold',
    method: 'POST',
    path: specificationItems,
    body: { kind: 'persona', content: {} },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item whose title is not a text',
    method: 'POST',
    path: specificationItems,
    body: { kind: 'spec_requirement', content: { ...requirementContent, title: 5 } },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item under a parent of another artifact',
    method: 'POST',
    path: specificationItems,
    body: { kind: 'spec_requirement', content: requirementContent, parent_item_id: persona.id },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item made while a run is running',
    page: '/?mock-run-status=running',
    method: 'POST',
    path: specificationItems,
    body: { kind: 'spec_requirement', content: requirementContent },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a deletion of a section that still holds items',
    method: 'DELETE',
    path: apiEndpoints.item.path({ itemId: discoverySection.id }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a deletion of an unknown item',
    method: 'DELETE',
    path: apiEndpoints.item.path({ itemId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a reorder that leaves an item out',
    method: 'POST',
    path: `${specificationItems}/reorder`,
    body: { parent_item_id: discoverySection.id, ids: [mentorRequirement.id] },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a reorder that names an item twice',
    method: 'POST',
    path: `${specificationItems}/reorder`,
    body: {
      parent_item_id: discoverySection.id,
      ids: [mentorRequirement.id, mentorRequirement.id],
    },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move of a section into itself',
    method: 'POST',
    path: apiEndpoints.itemMove.path({ itemId: functional.id }),
    body: { parent_item_id: functional.id, position: 1 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move of a section into one of its own sections',
    method: 'POST',
    path: apiEndpoints.itemMove.path({ itemId: functional.id }),
    body: { parent_item_id: discoverySection.id, position: 1 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move under an item of another artifact',
    method: 'POST',
    path: `${itemPath}/move`,
    body: { parent_item_id: persona.id, position: 1 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move to a position below 1',
    method: 'POST',
    path: `${itemPath}/move`,
    body: { parent_item_id: null, position: 0 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a restore of a version that never existed',
    method: 'POST',
    path: `${itemPath}/restore`,
    body: { version: 9 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
]

const backlog = artifactFixtureByKind(projectId, 'product_backlog')
const epic = itemFixtureByKey(projectId, 'EP-001')

/** An epic or a user story is added to the backlog, and the key it gets. */
export const backlogItemCases = [
  { name: 'an epic', itemType: 'epic', key: 'EP-003' },
  { name: 'a user story', itemType: 'user_story', key: 'US-007' },
]

export const backlogItems = apiEndpoints.artifactItems.path({ artifactId: backlog.id })
export const backlogContent = epic.content
