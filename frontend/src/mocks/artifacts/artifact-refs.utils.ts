import type { Artifact, ArtifactRef } from '@/modules/artifact/entities'

/** The reference to an artifact as it is now, at the version it is at. */
export function artifactRefOf(artifact: Artifact): ArtifactRef {
  return {
    artifact_id: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    version: artifact.version,
  }
}
