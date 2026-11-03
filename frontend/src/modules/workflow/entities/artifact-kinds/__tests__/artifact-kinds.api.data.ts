import { http } from 'msw'

import { emptyResponse } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getArtifactKinds, getContentSchema } from '../artifact-kinds.api'

/** A call of the artifact kinds API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the artifact kinds',
    call: () => getArtifactKinds(),
    request: { method: 'GET', path: apiEndpoints.artifactKinds.path(), body: null },
  },
  {
    name: 'reads the artifact kinds of a workflow version',
    call: () => getArtifactKinds(1),
    request: {
      method: 'GET',
      path: `${apiEndpoints.artifactKinds.path()}?workflow_version=1`,
      body: null,
    },
  },
  {
    name: 'reads the content schema of a kind at a version',
    call: () => getContentSchema('spec_requirement', 1),
    request: {
      method: 'GET',
      path: apiEndpoints.contentSchema.path({ kind: 'spec_requirement', version: '1' }),
      body: null,
    },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the artifact kinds',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.artifactKinds.path()),
    call: () => getArtifactKinds(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the artifact kinds (HTTP 500)',
    },
  },
  {
    name: 'a content schema that does not exist',
    refuse: () =>
      http.get(apiEndpoints.contentSchema.pattern, () => emptyResponse(HttpStatus.NotFound)),
    call: () => getContentSchema('spec_requirement', 9),
    error: {
      status: HttpStatus.NotFound,
      code: null,
      message: 'Failed to load the content schema (HTTP 404)',
    },
  },
]
