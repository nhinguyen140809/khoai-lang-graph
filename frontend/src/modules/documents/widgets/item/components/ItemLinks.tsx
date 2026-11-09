'use client'

import type { useItemLinks } from '@/modules/trace/entities'
import { ErrorState } from '@/shared/components/state'

import { itemPageMessages } from '../item-page.constants'
import { ItemLinkLine } from './ItemLinkLine'

/** The link line, with its own error state; nothing while it loads. */
export function ItemLinkLineBlock({
  projectId,
  links,
  activeLinkId,
  onActiveLinkChange,
}: {
  projectId: string
  links: ReturnType<typeof useItemLinks>
  activeLinkId: string | null
  onActiveLinkChange: (linkId: string | null) => void
}) {
  if (links.state !== 'success' || links.count === 0) return null
  return (
    <ItemLinkLine
      projectId={projectId}
      links={links}
      activeLinkId={activeLinkId}
      onActiveLinkChange={onActiveLinkChange}
    />
  )
}

/** The error of the links block, with its way to try again. */
export function LinkLineError({ onRetry }: { onRetry: () => void }) {
  return <ErrorState size="compact" message={itemPageMessages.linksLoadError} onRetry={onRetry} />
}
