'use client'

import type { FolderBlock } from '@/modules/artifact/entities'
import { Thumbnail, ThumbnailGrid } from '@/shared/components/thumbnail'

import type { ReaderHref } from '../reader.types'
import { viewOfBlock } from '../reader.utils'
import { ReaderLink } from './ReaderParts'

/** The blocks of a folder of a document in a grid, each a link that opens it in the reader. */
export function ReaderBlocks({
  blocks,
  artifactId,
  hrefOf,
}: {
  blocks: readonly FolderBlock[]
  artifactId: string
  hrefOf: ReaderHref
}) {
  return (
    <ThumbnailGrid>
      {blocks.map((block) => (
        <ReaderLink
          key={block.id}
          href={hrefOf(viewOfBlock(block.target, artifactId))}
          className="rounded-md hover:no-underline"
        >
          <Thumbnail look={block.look} title={block.title} icon={block.icon} seed={block.seed} />
        </ReaderLink>
      ))}
    </ThumbnailGrid>
  )
}
