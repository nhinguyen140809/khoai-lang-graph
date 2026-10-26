import type { ReactNode } from 'react'

import type { Hotkey } from '@/shared/lib/hotkey/hotkey.utils'

/** A command of the command palette, registered with `useCommands`. */
export interface PaletteCommand {
  /** Unique among the commands of the screen, such as `view.toggleSidePanel`. */
  id: string
  label: string
  /** The heading that the palette lists the command under, such as `PaletteGroup.View`. */
  group: string
  /** An icon element, such as `<SunIcon />`. */
  icon?: ReactNode
  /**
   * `destructive` shows the command in the color of an error, for a command about a failure, such
   * as loading a list again after it failed to load.
   */
  variant?: 'default' | 'destructive'
  /** Runs the command while it is registered; the palette shows it next to the label. */
  hotkey?: Hotkey
  /**
   * What the command does. Without it, the command is a line of information, shown disabled, such
   * as while the list it belongs to loads.
   */
  run?: () => void
}
export interface PaletteCommandGroup {
  heading: string
  commands: PaletteCommand[]
}
