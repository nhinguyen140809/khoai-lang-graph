import type { CommandHotkey } from './command.types'

/**
 * The groups of the palette that the frame and the features share. A feature names a group of its
 * own, such as `Projects`, in its own code.
 */
export const PaletteGroup = {
  /** Shows the side panel of a feature. */
  Show: 'Show',
  /** Changes what the screen shows: the panels, the theme. */
  View: 'View',
} as const

/** Opens and closes the palette, as the search box of the top bar does. */
export const paletteHotkey: CommandHotkey = { key: 'k', mod: true }
