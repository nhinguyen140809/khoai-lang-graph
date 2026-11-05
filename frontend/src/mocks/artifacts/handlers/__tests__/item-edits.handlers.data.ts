import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { itemFixtureByKey } from '../../fixtures/artifacts.fixtures'
import {
  analysisItems,
  analyzedRequirement,
  mentorRequirement,
  projectId,
} from './items.handlers.data'

const persona = itemFixtureByKey(projectId, 'PER-001')
export const analyzedPath = apiEndpoints.item.path({ itemId: analyzedRequirement.id })
const specificationPath = apiEndpoints.item.path({ itemId: mentorRequirement.id })
export const itemVersion = { [HttpHeader.IfMatch]: String(analyzedRequirement.version) }
const specificationVersion = { [HttpHeader.IfMatch]: String(mentorRequirement.version) }

/** The content of an analyzed requirement that the tests add. */
export const analyzedContent = {
  title: 'Rate a session',
  statement: 'The system shall let a student rate a session.',
  type: 'functional',
  quality_category: null,
  priority: 'could',
  rationale: 'Asked for in the interviews.',
}

/** A change the handlers refuse, and the status and code of the answer. */
export const itemEditRejectedCases: RejectedRequestCase[] = [
  {
    name: 'refuses a change without the version it is based on',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { title: 'x' } },
    status: HttpStatus.Conflict,
    answer: { code: 'version_conflict' },
  },
  {
    name: 'refuses a change while a run is running',
    page: '/?mock-run-status=running',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { title: 'x' } },
    headers: itemVersion,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a change when the run has ended',
    page: '/?mock-run-status=done',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { title: 'x' } },
    headers: itemVersion,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a change of an item outside the review',
    method: 'PATCH',
    path: specificationPath,
    body: { content: { title: 'x' } },
    headers: specificationVersion,
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a restore of an item outside the review',
    method: 'POST',
    path: `${specificationPath}/restore`,
    body: { version: 1 },
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses a content that breaks the schema',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { title: 5 } },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a content with a field the schema does not have',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { bogus: 1 } },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a value outside the list it takes its values from',
    method: 'PATCH',
    path: analyzedPath,
    body: { content: { priority: 'bogus' } },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a review status that does not exist',
    method: 'PATCH',
    path: analyzedPath,
    body: { review_status: 'done' },
    headers: itemVersion,
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item of a kind that the artifact does not hold',
    method: 'POST',
    path: analysisItems,
    body: { kind: 'interview_message', content: {} },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item whose title is not a text',
    method: 'POST',
    path: analysisItems,
    body: { kind: 'analyzed_requirement', content: { ...analyzedContent, title: 5 } },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item under a parent of another artifact',
    method: 'POST',
    path: analysisItems,
    body: { kind: 'analyzed_requirement', content: analyzedContent, parent_item_id: persona.id },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses an item made while a run is running',
    page: '/?mock-run-status=running',
    method: 'POST',
    path: analysisItems,
    body: { kind: 'analyzed_requirement', content: analyzedContent },
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
    path: `${analysisItems}/reorder`,
    body: { parent_item_id: null, ids: [analyzedRequirement.id] },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a reorder that names an item twice',
    method: 'POST',
    path: `${analysisItems}/reorder`,
    body: { parent_item_id: null, ids: [analyzedRequirement.id, analyzedRequirement.id] },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move under an item of another artifact',
    method: 'POST',
    path: `${analyzedPath}/move`,
    body: { parent_item_id: persona.id, position: 1 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a move to a position below 1',
    method: 'POST',
    path: `${analyzedPath}/move`,
    body: { parent_item_id: null, position: 0 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses a restore of a version that never existed',
    method: 'POST',
    path: `${analyzedPath}/restore`,
    body: { version: 9 },
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
]
