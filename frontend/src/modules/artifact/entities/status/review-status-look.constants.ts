import type { NodeVariant } from '@/shared/components/ui/node'
import type { Tone } from '@/shared/lib/tone'

import type { ReviewStatus } from '../artifacts/artifacts.types'

/** How a review status paints a node that stands for an item, as the look of a run status does. */
interface ReviewStatusNodeLook {
  /** The fill of the node: a status that asks for a look takes a tint, a settled item stays an outline. */
  variant: NodeVariant
  /** The color of the fill and of the border. */
  color: Tone
}

/**
 * How each review status paints a node of an item that asks nothing of the user. An approved item
 * is the solid primary block: it needs no action, and the full color says it is settled and sure. A
 * draft has no verdict yet and stays a plain outline, and an item that was rejected or replaced is
 * set aside, a muted gray fill that is also drawn faded and dashed. What an item asks of the user, and the colors that go with it, are the levels
 * of attention, not the review status.
 */
export const reviewStatusNodeLooks = {
  draft: { variant: 'outline', color: 'neutral' },
  approved: { variant: 'solid', color: 'primary' },
  rejected: { variant: 'soft', color: 'muted' },
  superseded: { variant: 'soft', color: 'muted' },
} as const satisfies Record<ReviewStatus, ReviewStatusNodeLook>
