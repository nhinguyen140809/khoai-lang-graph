import type { ReactNode } from 'react'

/**
 * A tool of the open project, registered with `useDeskTool`, such as its documents. A tool is data,
 * not a drawing: the arrangement of the desk draws it as it likes, a button with its name in the bar
 * of one, an icon with its name in a tooltip in the rail of another.
 * @view user
 */
export interface DeskTool {
  /** Unique among the tools, such as `documents`. */
  id: string
  /** The name of the tool, which every arrangement shows or announces. */
  label: string
  /** An icon element, such as `<FilesIcon />`; the desk sets its size. */
  icon: ReactNode
  /** Whether the tool is open, which the button shows as pressed. */
  isActive: boolean
  /** Opens the tool, or closes it while it is open. */
  onSelect: () => void
  /** Where the tool sits among the others, from the lowest to the highest. 0 by default. */
  order?: number | undefined
}
