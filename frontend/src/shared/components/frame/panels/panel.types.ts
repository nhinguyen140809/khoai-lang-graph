import type { ReactNode } from 'react'

/** The panels of the frame that the user resizes and hides, by the region they take. */
export const PanelRegion = {
  /** Left of the editor: the side panel of the feature chosen. */
  Side: 'side',
  /** Under the editor. */
  Bottom: 'bottom',
} as const

export type PanelRegion = (typeof PanelRegion)[keyof typeof PanelRegion]

/** A part of the panel under the editor, shown in its own tab. */
export interface BottomPanelSection {
  /** Unique in the panel. */
  id: string
  title: string
  /** Buttons at the right of the tabs while the section is shown, such as a filter. */
  actions?: ReactNode
  /** Fills the section, and scrolls itself when it flows. */
  content: ReactNode
}
