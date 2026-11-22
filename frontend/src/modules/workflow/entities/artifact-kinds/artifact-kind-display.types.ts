import type { KindMedia } from './artifact-kinds.types'

/**
 * How a kind of item reads on a screen: its title, whether its items can be opened one by one,
 * whether they have a chain of links to draw, what its content is, and the icon on its block.
 */
export interface ArtifactKindDisplay {
  title: string
  isNavigable: boolean
  /** Whether some link type lists the kind, so that its items have a chain; true while the definition loads. */
  isTraceable: boolean
  media: KindMedia
  /** The name of the icon on the block of the kind; null for a block without one. */
  icon: string | null
}
