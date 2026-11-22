'use client'

import type { FolderThumbnail } from '@/modules/artifact/entities'
import { Thumbnail, ThumbnailGrid } from '@/shared/components/thumbnail'

import type { ReaderHref } from '../reader.types'
import { viewOfThumbnail } from '../reader.utils'
import { ReaderLink } from './ReaderParts'

/** The thumbnails of a folder of a document in a grid, each a link that opens it in the reader. */
export function ReaderThumbnails({
  thumbnails,
  artifactId,
  hrefOf,
}: {
  thumbnails: readonly FolderThumbnail[]
  artifactId: string
  hrefOf: ReaderHref
}) {
  return (
    <ThumbnailGrid>
      {thumbnails.map((thumbnail) => (
        <ReaderLink
          key={thumbnail.id}
          href={hrefOf(viewOfThumbnail(thumbnail.target, artifactId))}
          className="rounded-md hover:no-underline"
        >
          <Thumbnail
            look={thumbnail.look}
            title={thumbnail.title}
            icon={thumbnail.icon}
            seed={thumbnail.seed}
          />
        </ReaderLink>
      ))}
    </ThumbnailGrid>
  )
}
