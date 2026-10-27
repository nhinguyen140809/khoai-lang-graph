import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import {
  type ArtifactKinds,
  artifactKindsSchema,
  type ContentSchema,
  contentSchemaSchema,
} from '../types/artifact-kinds.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/**
 * The artifact kinds and their item kinds, each with its content schema: those of the current
 * workflow version, or of the version that `workflowVersion` names.
 */
export function getArtifactKinds(workflowVersion?: number): Promise<ArtifactKinds> {
  const path = pathWithQuery(apiEndpoints.artifactKinds.path(), {
    workflow_version: workflowVersion,
  })
  return apiRequest(path, artifactKindsSchema, {
    action: 'load the artifact kinds',
  })
}

/** The content schema of a kind at one version, for an item written with an older one. */
export function getContentSchema(kind: string, version: number): Promise<ContentSchema> {
  return apiRequest(apiEndpoints.contentSchema.path({ kind, version }), contentSchemaSchema, {
    action: 'load the content schema',
  })
}
