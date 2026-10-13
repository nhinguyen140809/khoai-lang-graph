/** The panels of the frame that the user resizes and hides, by the region they take. */
export const PanelRegion = {
  /** Left of the editor: the side panel of the feature chosen. */
  Side: 'side',
  /** Under the editor. */
  Bottom: 'bottom',
} as const

export type PanelRegion = (typeof PanelRegion)[keyof typeof PanelRegion]

/** How a panel and the editor share the room of their region. */
interface PanelLayout {
  /** The direction in which they sit one after the other. */
  orientation: 'horizontal' | 'vertical'
  /** Where the panel sits: before the editor or after it. */
  position: 'before' | 'after'
  /** In pixels, before the user resizes the panel: its width, or its height under the editor. */
  defaultSize: number
  /** In pixels. */
  minSize: number
  /** A share of the room, such as `50%`. */
  maxSize: string
  /** The share of the room that the editor keeps at least. */
  editorMinSize: string
}

export const panelLayouts: Record<PanelRegion, PanelLayout> = {
  [PanelRegion.Side]: {
    orientation: 'horizontal',
    position: 'before',
    defaultSize: 280,
    minSize: 220,
    maxSize: '50%',
    editorMinSize: '30%',
  },
  [PanelRegion.Bottom]: {
    orientation: 'vertical',
    position: 'after',
    defaultSize: 240,
    minSize: 96,
    maxSize: '80%',
    editorMinSize: '20%',
  },
}
