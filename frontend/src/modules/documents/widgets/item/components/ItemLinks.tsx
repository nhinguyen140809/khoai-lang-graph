'use client'

import type { useItemLinks } from '@/modules/trace/entities'
import { ErrorState } from '@/shared/components/state'

import { itemPageMessages } from '../item-page.constants'
import { ItemLinkLine } from './ItemLinkLine'

/** The link line, with its own error state; nothing while it loads. */
export function ItemLinkLineBlock({
  projectId,
  links,
  lockedReason,
}: {
  projectId: string
  links: ReturnType<typeof useItemLinks>
  lockedReason: string | null
}) {
  if (links.state !== 'success' || links.count === 0) return null
  return <ItemLinkLine projectId={projectId} links={links} lockedReason={lockedReason} />
}

/** The error of the links block, with its way to try again. */
export function LinkLineError({ onRetry }: { onRetry: () => void }) {
  return <ErrorState size="compact" message={itemPageMessages.linksLoadError} onRetry={onRetry} />
}
