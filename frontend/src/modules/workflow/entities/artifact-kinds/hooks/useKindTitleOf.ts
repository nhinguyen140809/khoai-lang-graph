'use client'

import { useContentSchemas } from './useArtifactKindQueries'

/**
 * The title of a kind, by its key, as the schema of its content names it: the key itself until
 * the kinds load. The titles are built once, and the reader is stable for its dependents.
 */
export function useKindTitleOf(): (kind: string) => string {
  const schemas = useContentSchemas()
  return (kind) => schemas.get(kind)?.title ?? kind
}
