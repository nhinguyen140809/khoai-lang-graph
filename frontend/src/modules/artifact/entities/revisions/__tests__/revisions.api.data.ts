import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { SentRequestCase } from '@/test/suites'

import { listArtifactRevisions, listItemRevisions } from '../revisions.api'

const plan = artifactFixtureByKind(projectIds.mentor, 'elicitation_plan')
const requirement = itemFixtureByKey(projectIds.mentor, 'REQ-001')
const artifactPath = apiEndpoints.artifact.path({ artifactId: plan.id })
const itemPath = apiEndpoints.item.path({ itemId: requirement.id })

/** A call of the revisions API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists a page of the versions of an artifact',
    call: () => listArtifactRevisions(plan.id, '1', 1),
    request: {
      method: 'GET',
      path: `${artifactPath}/revisions?limit=1&cursor=1`,
      body: null,
    },
  },
  {
    name: 'lists a page of the versions of an item',
    call: () => listItemRevisions(requirement.id, null, 50),
    request: { method: 'GET', path: `${itemPath}/revisions?limit=50`, body: null },
  },
] satisfies SentRequestCase[]
