import { type ArtifactItem, reviewStatus } from '@/modules/artifact/entities/@x/trace'

import type { TraceLink } from './trace-links.types'

/**
 * Whether a link is out of date: it was made against an older version of its target, or its target
 * was replaced. The source then needs a new look.
 */
export function isLinkOutOfDate(
  link: Pick<TraceLink, 'target_version'>,
  target: Pick<ArtifactItem, 'version' | 'review_status'>,
): boolean {
  return link.target_version < target.version || target.review_status === reviewStatus.superseded
}
