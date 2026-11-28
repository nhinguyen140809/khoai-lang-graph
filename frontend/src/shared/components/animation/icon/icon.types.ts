import type { MotionValue } from 'motion/react'

import type { AssetView } from '../asset/asset.types'

/** What an icon that is drawn by a clock takes: how far it has come, from 0 to 1, as a value that changes over time. */
export interface DrawnIconProps {
  progress: MotionValue<number>
  className?: string | undefined
  /** How thick its strokes are, in units of its 24 by 24 frame; `defaultIconStroke` (1.5) when none is given. */
  stroke?: number | undefined
  /** The angle it is seen from, for an icon drawn as an asset; the one of the place around it when none is given. */
  view?: AssetView | undefined
}

/** What an icon draws: the middle of its marks and the largest side that they take, in units of its 24 by 24 frame. */
export interface IconBounds {
  x: number
  y: number
  size: number
}
