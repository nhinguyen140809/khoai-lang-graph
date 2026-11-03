'use client'

import { useProjectArtifacts } from '@/modules/artifact/entities/@x/documents'

/**
 * The title of a document as the list of the project gives it, which the side panel has loaded, for
 * a page whose document did not load: `title` is undefined when the list lacks the document, and
 * `isPending` holds until the list loads or fails.
 */
export function useListedDocumentTitle(
  projectId: string,
  artifactId: string,
): { title: string | undefined; isPending: boolean } {
  const artifacts = useProjectArtifacts(projectId)
  return {
    title: artifacts.data?.find(({ id }) => id === artifactId)?.title,
    isPending: artifacts.isPending,
  }
}
