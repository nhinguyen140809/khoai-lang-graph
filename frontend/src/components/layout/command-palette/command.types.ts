import type { ReactNode } from 'react'

/** A key that runs a command anywhere on the page. */
export interface CommandHotkey {
  /** A character, such as `b`, or a key name, such as `Escape`. */
  key: string
  /** Requires Ctrl, or Cmd on macOS. */
  mod?: boolean
  /** Requires Ctrl on every platform, for a key whose Cmd shortcut macOS keeps, such as `` ` ``. */
  ctrl?: boolean
}

/** A command of the command palette, registered with `useCommands`. */
export interface PaletteCommand {
  /** Unique among the commands of the screen, such as `view.toggleSidePanel`. */
  id: string
  label: string
  /** The heading that the palette lists the command under, such as `View`. */
  group: string
  /** An icon element, such as `<SunIcon />`. */
  icon?: ReactNode
  /** Runs the command while it is registered; the palette shows it next to the label. */
  hotkey?: CommandHotkey
  /**
   * What the command does. Without it, the command is a line of information, shown disabled, such
   * as while the list it belongs to loads.
   */
  run?: () => void
}
