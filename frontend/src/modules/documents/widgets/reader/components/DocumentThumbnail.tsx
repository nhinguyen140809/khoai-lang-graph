'use client'

import { type DocumentMark, documentMarkLook } from '@/modules/documents/entities'
import {
  hasItemBlocks,
  iconOf,
  kindSchemasByKind,
  useArtifactKinds,
} from '@/modules/workflow/entities'
import { Thumbnail } from '@/shared/components/thumbnail'
import { Badge } from '@/shared/components/ui/badge'

import { documentMarkViews } from '../document-thumbnail.constants'
import type { ReaderHref, ReaderView } from '../reader.types'
import { ReaderLink } from './ReaderParts'

interface DocumentThumbnailProps {
  kind: string
  title: string
  /** What the thumbnail opens in the reader; null for one that has nothing to open yet. */
  view: ReaderView | null
  mark: DocumentMark
  /** Draws a folder whatever the kind is, for the folder of the documents of one kind. */
  isGroup?: boolean
  hrefOf: ReaderHref
}

/**
 * A document of the grid: a folder when it is the folder of the documents of one kind or when its
 * kind holds items that open one by one, a page of text when it holds only text, with the icon that
 * its kind names. What the mark allows is read from `documentMarkViews`: a link opens it in the
 * reader, the mark shows under it when it asks for the user or is being written, and a document
 * that is not started only reads, muted.
 */
export function DocumentThumbnail({
  kind,
  title,
  view,
  mark,
  isGroup = false,
  hrefOf,
}: DocumentThumbnailProps) {
  const { data: kinds } = useArtifactKinds()
  const { isOpenable, showsMark } = documentMarkViews[mark]
  const look = documentMarkLook(mark)
  const isFolder = isGroup || hasItemBlocks(kinds, kind)
  const schema = kindSchemasByKind(kinds).get(kind)?.schema
  const thumbnail = (
    <Thumbnail
      look={isFolder ? 'folder' : 'text'}
      title={title}
      icon={schema === undefined ? null : iconOf(schema)}
      seed={isFolder ? title : kind}
    />
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {isOpenable && view !== null ? (
        <ReaderLink href={hrefOf(view)} className="w-full rounded-md hover:no-underline">
          {thumbnail}
        </ReaderLink>
      ) : (
        <div aria-disabled className="w-full opacity-60">
          {thumbnail}
        </div>
      )}
      {showsMark && look.color !== null && (
        <Badge variant="soft" color={look.color}>
          {look.label}
        </Badge>
      )}
    </div>
  )
}
