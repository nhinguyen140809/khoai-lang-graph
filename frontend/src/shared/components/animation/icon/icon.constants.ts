/** How thick the strokes of the icons that a clock draws are, in units of their 24 by 24 frame, unless a caller gives another. */
export const defaultIconStroke = 1.5

/** How large the largest side of what an icon draws is, in units of its 24 by 24 frame, so that the icons look as large as one another. The stroke comes on top of it. */
export const iconExtent = 18

/**
 * What each icon draws, measured over a whole round of its clock, as the middle of its marks and the
 * largest side that they take, in units of a 24 by 24 frame. `IconFrame` scales an icon so that this
 * side is `iconExtent` and puts its middle in the middle of the frame. To change how large an icon
 * looks, change its entry; to change how large they all look, change `iconExtent`.
 */
export const iconBounds = {
  bars: { x: 12, y: 12.5, size: 15 },
  chartSpline: { x: 12.8, y: 10.2, size: 19.6 },
  check: { x: 12, y: 12, size: 16 },
  circleHelp: { x: 12, y: 12, size: 20 },
  code: { x: 12, y: 12, size: 18 },
  download: { x: 12, y: 12, size: 16 },
  // Its rows come in and go out at the edges, so it is measured by the rows that are seen at rest.
  eventList: { x: 12, y: 12, size: 20 },
  fork: { x: 12, y: 12, size: 19.6 },
  gantt: { x: 11.5, y: 12, size: 18 },
  globe: { x: 12, y: 12, size: 18 },
  kanban: { x: 12, y: 12, size: 14.6 },
  laptop: { x: 12.6, y: 12.2, size: 19.2 },
  layers: { x: 12, y: 12, size: 21 },
  library: { x: 9.6, y: 11.8, size: 16.4 },
  link: { x: 12, y: 12, size: 21 },
  messageSquare: { x: 12, y: 12, size: 21 },
  nodes: { x: 12, y: 12, size: 20 },
  // The pen, the glass and the plane move or leave a trail while the round goes: they are measured at rest.
  pen: { x: 12, y: 12, size: 20 },
  search: { x: 12, y: 12, size: 18 },
  send: { x: 12, y: 12, size: 18 },
  text: { x: 12, y: 11.5, size: 20.6 },
  zip: { x: 12, y: 12, size: 18 },
  typedLine: { x: 13, y: 12, size: 22 },
  // Its blocks are measured at rest, together, and not apart.
  ungroup: { x: 12, y: 12, size: 17 },
} as const
