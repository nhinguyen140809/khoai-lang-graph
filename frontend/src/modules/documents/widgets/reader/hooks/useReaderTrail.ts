'use client'

import { useArtifactOutline, useItem } from '@/modules/artifact/entities'
import { documentsMessages } from '@/modules/documents/entities'
import { useKindTitleOf, useWorkflowDefinition } from '@/modules/workflow/entities'

import type { ReaderView, TrailStep } from '../reader.types'
import { groupTrail, readerTrail, trailPlaceOf } from '../reader-trail.utils'

/**
 * The path above the content of the reader, from the list of the documents down to where it is;
 * null for the list itself, and while the document that the path needs is loading.
 */
export function useReaderTrail(view: ReaderView): TrailStep[] | null {
  const isItem = view.kind === 'item'
  const item = useItem(isItem ? view.itemId : '', undefined, { isEnabled: isItem })
  let artifactId: string | undefined
  if (view.kind === 'item') artifactId = item.data?.artifact_id
  else if (view.kind !== 'documents' && view.kind !== 'group') artifactId = view.artifactId
  const outline = useArtifactOutline(artifactId)
  const definition = useWorkflowDefinition()
  const kindTitleOf = useKindTitleOf()

  if (view.kind === 'group') {
    return groupTrail({
      documentsTitle: documentsMessages.title,
      title: kindTitleOf(view.documentKind),
    })
  }

  if (view.kind === 'documents' || outline.state !== 'success') return null
  const place = trailPlaceOf(view, outline.nodes)
  const { kind } = outline.artifact
  const isOfSeveral = definition.data?.artifact_kinds.some(
    (defined) => defined.kind === kind && defined.per_project !== 'one',
  )
  return readerTrail({
    documentsTitle: documentsMessages.title,
    group: isOfSeveral === true ? { kind, title: kindTitleOf(kind) } : null,
    artifact: outline.artifact,
    nodes: outline.nodes,
    place,
  })
}
