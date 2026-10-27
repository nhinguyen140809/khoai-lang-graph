import type { ArtifactKinds, ContentSchema, KindSchema } from '../types/artifact-kinds.types'

/**
 * The version and the content schema of every kind, artifact kinds and item kinds alike, by kind
 * name.
 */
export function kindSchemasByKind(kinds: ArtifactKinds | undefined): Map<string, KindSchema> {
  const schemas = new Map<string, KindSchema>()
  for (const artifactKind of kinds?.artifact_kinds ?? []) {
    schemas.set(artifactKind.kind, artifactKind)
    for (const itemKind of artifactKind.item_kinds) schemas.set(itemKind.kind, itemKind)
  }
  return schemas
}

/** The content schema alone of every kind, by kind name, for a reader that does not need its version. */
export function contentSchemasByKind(kinds: ArtifactKinds | undefined): Map<string, ContentSchema> {
  return new Map(
    Array.from(kindSchemasByKind(kinds), ([kind, { schema }]) => [kind, schema] as const),
  )
}
