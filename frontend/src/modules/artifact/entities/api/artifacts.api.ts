import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchAllPages, fetchPage, type ListPage } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { artifactsPageSize } from '../page-sizes.constants'
import {
  type Artifact,
  type ArtifactFilters,
  artifactSchema,
  type UpdateArtifactBody,
} from '../types/artifacts.types'
import { type Revision, revisionSchema } from '../types/revisions.types'
import { artifactFilterParams } from '../utils/filter-params.utils'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The artifacts of a project, in the order of the stages that make them. */
export function listProjectArtifacts(
  projectId: string,
  filters: ArtifactFilters = {},
): Promise<Artifact[]> {
  const path = pathWithQuery(
    apiEndpoints.projectArtifacts.path({ projectId }),
    artifactFilterParams(filters),
  )
  return fetchAllPages(path, artifactSchema, {
    limit: artifactsPageSize,
    action: 'load the artifacts',
  })
}

/** One artifact; with `version`, the artifact as it was at that version. */
export function getArtifact(artifactId: string, version?: number): Promise<Artifact> {
  return apiRequest(
    pathWithQuery(apiEndpoints.artifact.path({ artifactId }), { version }),
    artifactSchema,
    { action: 'load the artifact' },
  )
}

/**
 * Changes fields of an artifact; `version` is the version that the change is based on, and an
 * artifact that moved on since answers a version conflict.
 */
export function updateArtifact(
  artifactId: string,
  version: number,
  change: UpdateArtifactBody,
): Promise<Artifact> {
  return apiRequest(apiEndpoints.artifact.path({ artifactId }), artifactSchema, {
    action: 'save the artifact',
    method: HttpMethod.Patch,
    body: change,
    headers: { [HttpHeader.IfMatch]: String(version) },
  })
}

/** One page of the versions of an artifact, newest first. */
export function listArtifactRevisions(
  artifactId: string,
  cursor: string | null,
  limit: number,
): Promise<ListPage<Revision>> {
  return fetchPage(apiEndpoints.artifactRevisions.path({ artifactId }), revisionSchema, {
    limit,
    cursor,
    action: 'load the versions of the artifact',
  })
}

/** Makes an old version of an artifact and of its items current again, as new versions. */
export function restoreArtifact(artifactId: string, version: number): Promise<Artifact> {
  return apiRequest(apiEndpoints.artifactRestore.path({ artifactId }), artifactSchema, {
    action: 'restore the artifact',
    method: HttpMethod.Post,
    body: { version },
  })
}
