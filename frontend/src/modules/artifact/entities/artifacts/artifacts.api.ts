import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod } from '@/shared/api/http'
import { apiRequest, fetchAllPages } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { artifactsPageSize } from './artifacts.constants'
import {
  type Artifact,
  type ArtifactFilters,
  artifactSchema,
  type UpdateArtifactBody,
} from './artifacts.types'
import { artifactFilterParams } from './filter-params.utils'

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

/** Makes an old version of an artifact and of its items current again, as new versions. */
export function restoreArtifact(artifactId: string, version: number): Promise<Artifact> {
  return apiRequest(apiEndpoints.artifactRestore.path({ artifactId }), artifactSchema, {
    action: 'restore the artifact',
    method: HttpMethod.Post,
    body: { version },
  })
}
