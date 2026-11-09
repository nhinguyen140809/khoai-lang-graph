import type { AttentionLevel } from '@/modules/artifact/entities'
import { viewTraceMessages } from '@/modules/trace/features/view-trace'
import type { EdgeVariant, EdgeWeight } from '@/shared/components/ui/edge'
import type { NodeVariant } from '@/shared/components/ui/node'
import type { Tone } from '@/shared/lib/tone'

/**
 * The size that every node of the chain is laid out with: a node stays the same size whatever is
 * chosen on the canvas, so choosing a link moves nothing.
 */
export const chainNodeSize = { width: 176, height: 84 } as const

/**
 * The room around the links of the chain, in pixels. `layer` is the room between two columns: the
 * title of a link and the arrow that ends in its node both sit in it, so it is wider than the title
 * of the longest link type. `arrow` is how far before the node an arrow stops: the ring that marks
 * the end of a link sits on the border of the node and would cover the tip of the arrow.
 */
export const chainGaps = { layer: 144, arrow: 8 } as const

/** From how many nodes the canvas shows a minimap, and renders only the visible nodes. */
export const chainFromNodeCount = { minimap: 40, visibleOnly: 100 } as const

/**
 * The look of an edge, by how much its link asks of the user, and by its line style and its width:
 * a thick solid line reads as a link that is sure, and a dashed or dotted one as a link that is
 * open or set aside, so no line is thinner than the regular one. A link to check is the thick
 * orange line, a link that asks nothing the thick gray line, one from an open issue a dashed blue
 * line, in the primary color that marks the same level in the side panel and the tree, and one to
 * an item that is set aside a dotted muted line.
 */
export const chainEdgeLooks = {
  act: { variant: 'solid', weight: 'strong', color: 'warning' },
  follow: { variant: 'dashed', weight: 'regular', color: 'primary' },
  none: { variant: 'solid', weight: 'strong', color: 'neutral' },
  quiet: { variant: 'dotted', weight: 'regular', color: 'muted' },
} as const satisfies Record<
  AttentionLevel,
  { variant: EdgeVariant; weight: EdgeWeight; color: Tone }
>

/**
 * The fill of a node by what its item asks of the user, which wins over the fill of its review
 * status: an item to check is orange, an item to follow, such as an open issue, blue (the primary
 * color, as the same level reads in the side panel and the tree), and
 * an item that is set aside, rejected or replaced, is muted. An item that asks nothing has no fill
 * of its own, so its review status paints the node.
 */
export const chainNodeAttentionLooks = {
  act: { variant: 'soft', color: 'warning' },
  follow: { variant: 'soft', color: 'primary' },
  none: null,
  quiet: { variant: 'soft', color: 'muted' },
} as const satisfies Record<AttentionLevel, { variant: NodeVariant; color: Tone } | null>

/**
 * The look of the node of the item the page is about: a solid yellow block (the yellow of the
 * charts, which stands out against the blue of the app and carries no verdict), whatever its review
 * status and what it asks, with a ring of its tone around it. It is the one solid node of the
 * graph, so the eye starts from it.
 */
export const chainSubjectLook = { variant: 'solid', color: 'chart' } as const satisfies {
  variant: NodeVariant
  color: Tone
}

export const itemTraceMessages = {
  title: viewTraceMessages.traceTitle,
  /** Said once, in the explanation behind the information button, not under the title. */
  description:
    'The items on the left are what this item is based on, down to the interviews. The items on the right were built from it. An arrow points from an item to the item it is based on.',
  /** How to move around the graph: the wheel alone scrolls the page, so zooming holds a key. */
  moving: (modifierKey: string) =>
    `To zoom, hold ${modifierKey} and turn the mouse wheel, or use the buttons at the bottom left. To move the graph, drag its empty space.`,
  basedOn: 'Based on',
  builtFrom: 'Built from it',
  outOfDateLinks: (count: number) =>
    count === 1 ? '1 link is out of date.' : `${String(count)} links are out of date.`,
  showOutOfDate: 'Show the link',
  legendButton: 'How to read this page',
  legend: {
    act: 'The item that this link is based on changed after the link was made. Check that the two items still agree.',
    follow: 'The link comes from an issue that is still open.',
    none: 'The link is up to date and no issue is open about it.',
    quiet: 'The link is to an item that was rejected or replaced.',
  },
  /** What the fill of a node says, from the item that asks most to the one that asks least. */
  nodeLegend: {
    act: 'The item needs a check: a link to it is out of date, or an open issue is about it.',
    follow: 'The item lacks a link, or it is an issue that is still open.',
    approved: 'The item was approved.',
    draft: 'The item is a draft that nobody reviewed yet.',
    quiet: 'The item was rejected or replaced, so it is faded.',
    subject: 'The item of this page is the solid one, with a thicker border.',
  },
  legendNodes: 'Items',
  legendLines: 'Links',
  madeFrom: (version: number) => `made from version ${String(version)}`,
  noLink: 'This item has no link yet.',
  asList: 'Read the links as a list',
  menu: {
    showQuotes: 'Show quotes',
    more: (itemTitle: string) => `More actions for ${itemTitle}`,
  },
  loading: 'Loading the trace',
  errorTab: 'Trace',
  loadError: 'The trace could not load.',
  notFound: { title: 'This item does not exist.', description: 'It may have been removed.' },
} as const

/**
 * The rows of the legend of the items, from the item that asks most to the one that asks least,
 * and the item of the page: each is a node painted by `chainNodeProps` from the state that gives
 * it, so the legend never says a look that the graph does not draw.
 */
export const chainNodeLegendRows = [
  { key: 'act', state: { status: 'draft', attention: 'act', isSubject: false } },
  { key: 'follow', state: { status: 'draft', attention: 'follow', isSubject: false } },
  { key: 'approved', state: { status: 'approved', attention: 'none', isSubject: false } },
  { key: 'draft', state: { status: 'draft', attention: 'none', isSubject: false } },
  { key: 'quiet', state: { status: 'rejected', attention: 'quiet', isSubject: false } },
  { key: 'subject', state: { status: 'draft', attention: 'none', isSubject: true } },
] as const
