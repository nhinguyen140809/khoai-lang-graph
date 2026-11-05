import type { Route } from 'next'

import type { AttentionLevel } from '@/modules/artifact/entities'
import type { DocumentTabIconName } from '@/modules/documents/entities'
import type { Tone } from '@/shared/lib/tone'

/** What a click on a row does: opens its page, asks to load the outline again, or nothing. */
export type TreeAction = { type: 'open'; href: Route } | { type: 'retry' } | { type: 'none' }

/** How a row shows: how much it asks of the user, the color for that, the letter and the full text. */
export interface RowLook {
  level: AttentionLevel
  color: Tone | null
  /** One character at the end of the row, or null when the color alone says it. */
  letter: string | null
  /** What the row says in full, for its tooltip and for assistive technology. */
  text: string | null
}

/**
 * One row of the flat record that the tree reads: its title, where it sits, its children and all
 * that it needs to draw, so the tree only draws.
 */
export interface TreeNode {
  id: string
  /** What the row is called, and what the type-ahead of the tree matches. */
  name: string
  parentId: string | null
  children: string[]
  action: TreeAction
  /** How the row shows when it is expanded or has nothing to expand. */
  look: RowLook
  /** How the row shows when it is collapsed: a section takes the level of the highest row under it. */
  collapsedLook: RowLook
  /** How many rows a collapsed row holds, or null for a row that holds none. */
  count: number | null
  /** The titles above the row, from the top down to its parent, which its tooltip shows before its own title. */
  location: string[]
  /** The name of the tab icon that goes before the title, or null for a row without one. */
  icon: DocumentTabIconName | null
}
