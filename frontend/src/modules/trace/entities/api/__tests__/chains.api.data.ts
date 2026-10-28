import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { SentRequestCase } from '@/test/suites'

import { getArtifactTrace, getItemTrace } from '../chains.api'

const projectId = projectIds.mentor
export const requirement = itemFixtureByKey(projectId, 'REQ-001')
export const specification = artifactFixtureByKind(projectId, 'requirement_specification')

const itemTracePath = apiEndpoints.itemTrace.path({ itemId: requirement.id })
const artifactTracePath = apiEndpoints.artifactTrace.path({ artifactId: specification.id })

/** A call of the trace API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the trace of an item with the defaults of the API',
    call: () => getItemTrace(requirement.id),
    request: { method: 'GET', path: itemTracePath, body: null },
  },
  {
    name: 'reads the trace of an item in one direction and to a depth',
    call: () => getItemTrace(requirement.id, { direction: 'backward', depth: 2 }),
    request: { method: 'GET', path: `${itemTracePath}?direction=backward&depth=2`, body: null },
  },
  {
    name: 'reads the trace of an artifact with the defaults of the API',
    call: () => getArtifactTrace(specification.id),
    request: { method: 'GET', path: artifactTracePath, body: null },
  },
  {
    name: 'reads the trace of an artifact in one direction',
    call: () => getArtifactTrace(specification.id, { direction: 'forward' }),
    request: { method: 'GET', path: `${artifactTracePath}?direction=forward`, body: null },
  },
] satisfies SentRequestCase[]
