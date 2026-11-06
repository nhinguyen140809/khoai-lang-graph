import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { traceLinkFixtures } from '@/mocks/trace/fixtures/trace-links.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { assertPresent } from '@/shared/lib/guards'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { createTraceLink, deleteTraceLink, listProjectTraceLinks } from '../trace-links.api'
import type { CreateTraceLinkBody } from '../trace-links.types'

export const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const otherRequirement = itemFixtureByKey(projectId, 'REQ-002')

/** A link between two items that the type allows and that does not exist yet. */
export const newLink: CreateTraceLinkBody = {
  source_item_id: otherRequirement.id,
  target_item_id: requirement.id,
  link_type: 'depends_on',
  note: 'Needs the search first.',
}

/** A link of the fixtures, which the removal cases remove. */
const existingLinkId = assertPresent(traceLinkFixtures[0], 'No mock trace link').id

const linksPath = apiEndpoints.projectTraceLinks.path({ projectId })

/** A call of the trace links API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists a page of the links of a project',
    call: () => listProjectTraceLinks(projectId, null, 200),
    request: { method: 'GET', path: `${linksPath}?limit=200`, body: null },
  },
  {
    name: 'lists the next page of the links',
    call: () => listProjectTraceLinks(projectId, '2', 2),
    request: { method: 'GET', path: `${linksPath}?limit=2&cursor=2`, body: null },
  },
  {
    name: 'lists the links that match every filter',
    call: () =>
      listProjectTraceLinks(projectId, null, 50, {
        linkType: 'derived_from',
        sourceItemId: 'i1',
        targetItemId: 'i2',
      }),
    request: {
      method: 'GET',
      path: `${linksPath}?link_type=derived_from&source_item_id=i1&target_item_id=i2&limit=50`,
      body: null,
    },
  },
  {
    name: 'makes a link',
    call: () => createTraceLink(projectId, newLink),
    request: { method: 'POST', path: linksPath, body: newLink },
  },
  {
    name: 'removes a link',
    call: () => deleteTraceLink(existingLinkId),
    request: {
      method: 'DELETE',
      path: apiEndpoints.traceLink.path({ linkId: existingLinkId }),
      body: null,
    },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the links',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.projectTraceLinks.pattern),
    call: () => listProjectTraceLinks(projectId, null, 200),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the links (HTTP 500)',
    },
  },
  {
    name: 'a failed removal of a link',
    refuse: () => serverErrorOn(HttpMethod.Delete, apiEndpoints.traceLink.pattern),
    call: () => deleteTraceLink(existingLinkId),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to remove the link (HTTP 500)',
    },
  },
]
