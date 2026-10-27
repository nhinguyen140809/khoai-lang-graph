import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { projectIds } from '../../../shared/db'
import { artifactFixtureByKind, itemFixtureByKey } from '../../fixtures/artifacts.fixtures'

export const projectId = projectIds.mentor
export const specification = artifactFixtureByKind(projectId, 'requirement_specification')
/** A requirement under the section Mentor discoverySection, which holds two. */
export const mentorRequirement = itemFixtureByKey(projectId, 'REQ-001')
export const discoverySection = itemFixtureByKey(projectId, 'SEC-004')
export const itemPath = apiEndpoints.item.path({ itemId: mentorRequirement.id })
export const specificationItems = apiEndpoints.artifactItems.path({ artifactId: specification.id })

/** A read the handlers refuse, and the status and code of the answer. */
export const itemRejectedCases: RejectedRequestCase[] = [
  {
    name: 'refuses a read of an unknown item',
    method: 'GET',
    path: apiEndpoints.item.path({ itemId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of an item in the empty scenario',
    page: '/?mock-item=empty',
    method: 'GET',
    path: itemPath,
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of a version that never existed',
    method: 'GET',
    path: `${itemPath}?version=9`,
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the items of an unknown artifact',
    method: 'GET',
    path: apiEndpoints.artifactItems.path({ artifactId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses a read of the items of an unknown project',
    method: 'GET',
    path: apiEndpoints.projectItems.path({ projectId: 'missing' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
]
