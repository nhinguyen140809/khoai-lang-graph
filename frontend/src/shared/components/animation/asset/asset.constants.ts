import type { AssetSize } from './asset.types'

/**
 * The angle the assets are seen from, until the place around them says another: turned a third
 * of a right angle, and looked down on as the camera of the stage of the playground is. A space
 * that has its own camera works the angle out from where the one that looks stands, and gives it
 * to each thing it looks at.
 */
export const defaultAssetView = { yaw: -35, pitch: 35 } as const

/** How far one pixel of a drag turns the view of an asset, in degrees. */
export const assetDragDegrees = 0.75

/** The sizes an asset comes in, as classes of the box it stands in; what it draws is fitted to one extent, so every asset takes the same room at a size. */
export const assetSizeClasses = {
  lg: 'size-16',
  xl: 'size-24',
  '2xl': 'size-36',
} as const satisfies Record<AssetSize, string>

/**
 * What each asset draws, measured over a whole round of its clock at the default view, as the
 * middle of its marks and the largest side that they take, in units of a 24 by 24 frame.
 * `AssetFrame` scales an asset so that this side is the extent of the icons and puts its middle
 * in the middle of the frame. To change how large an asset looks, change its entry.
 */
export const assetBounds = {
  // Measured as it comes out at the default view, over the whole swing of its screen.
  laptop: { x: 12.45, y: 8, size: 16.38 },
  // Measured as it comes out at the default view, over a whole turn of the globe.
  globe: { x: 12, y: 12, size: 12.61 },
  // The four shapes of the board, measured as they come out at the default view; the board stands still.
  // A board takes more of the frame than a thing alone does, for it carries what is drawn on it.
  board: { x: 12.8, y: 5.93, size: 14.18 },
  boardSquare: { x: 12.66, y: 7.06, size: 12.16 },
  boardPanel: { x: 12.51, y: 8.18, size: 10.87 },
  boardBanner: { x: 12.3, y: 9.75, size: 10.13 },
  // Measured as it comes out at the default view, over the whole swing of the pen about its point.
  pen: { x: 12.51, y: 13.16, size: 15.73 },
  // Measured as they come out at the default view; the library, the search glass and the message stand still.
  library: { x: 12.32, y: 8.03, size: 9.67 },
  search: { x: 11.41, y: 8.51, size: 9.45 },
  messageSquare: { x: 12.26, y: 10.31, size: 10.07 },
  layers: { x: 12, y: 11.01, size: 7.46 },
  zip: { x: 12, y: 8.89, size: 11.97 },
  stack: { x: 11.87, y: 11.33, size: 14.35 },
  scatter: { x: 11.8, y: 11.78, size: 17.13 },
} as const
