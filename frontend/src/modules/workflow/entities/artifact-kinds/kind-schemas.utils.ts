import type { ArtifactKinds, ContentSchema, KindMedia, KindSchema } from './artifact-kinds.types'

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

/**
 * Whether the items of a kind can be reached one by one, with a row in the outline of a document
 * and a page of their own. A kind without the keyword can; the items that cannot are short enough
 * to read in place in the page of the document.
 */
export function isNavigable(schema: ContentSchema): boolean {
  return schema['x-ui-navigable'] !== false
}

/** What the content of a kind is: text unless the schema says it is a diagram. */
export function mediaOf(schema: ContentSchema): KindMedia {
  return schema['x-ui-media'] ?? 'text'
}

/** The name of the icon on the block of a kind; null when the schema names none or says there is none. */
export function iconOf(schema: ContentSchema): string | null {
  return schema['x-ui-icon'] ?? null
}

/**
 * Whether the documents of an artifact kind hold items that open one by one and are more than
 * sections: such a document is a folder, and one that holds only text is a page.
 */
export function hasItemBlocks(kinds: ArtifactKinds | undefined, artifactKind: string): boolean {
  const defined = kinds?.artifact_kinds.find(({ kind }) => kind === artifactKind)
  return (
    defined?.item_kinds.some(
      ({ schema }) => isNavigable(schema) && schema['x-ui-display'] !== 'heading',
    ) ?? false
  )
}
