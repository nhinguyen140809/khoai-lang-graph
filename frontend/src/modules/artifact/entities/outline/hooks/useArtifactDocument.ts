'use client'

import { useMemo } from 'react'

import { contentFields } from '@/modules/workflow/entities/@x/artifact'
import { isNotFoundError } from '@/shared/api/error'
import { isEmpty } from '@/shared/lib/guards'

import { useArtifact } from '../../artifacts/hooks/useArtifactQueries'
import { useItemSchema } from '../../items/hooks/useItemQueries'
import { documentBlocks } from '../document-blocks.utils'
import type { ArtifactDocumentResult } from '../outline.types'
import { useOutlineItems } from './useOutlineItems'

/**
 * The document of an artifact for its page: the artifact, its filled fields and the parts of its
 * page in the order of the outline. It is `notFound` for an artifact that does not exist.
 */
export function useArtifactDocument(artifactId: string): ArtifactDocumentResult {
  const artifact = useArtifact(artifactId)
  const { schema } = useItemSchema(artifact.data)
  const outline = useOutlineItems(artifactId)

  const fields = useMemo(() => {
    const content = artifact.data?.content
    if (schema === undefined || content === undefined) return []
    return contentFields(schema).filter((field) => !isEmpty(content[field.name]))
  }, [schema, artifact.data?.content])
  const blocks = useMemo(
    () => (outline.state === 'success' ? documentBlocks(outline) : []),
    [outline],
  )

  if (artifact.isError) {
    if (isNotFoundError(artifact.error)) return { state: 'notFound' }
    return {
      state: 'error',
      retry: () => {
        void artifact.refetch()
      },
    }
  }
  if (outline.state === 'error') return { state: 'error', retry: outline.retry }
  if (artifact.data === undefined || outline.state === 'pending') return { state: 'pending' }
  return { state: 'success', artifact: artifact.data, fields, blocks, kinds: outline.kinds }
}
