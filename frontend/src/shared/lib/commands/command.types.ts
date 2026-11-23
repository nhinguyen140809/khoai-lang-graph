import type { ReactNode } from 'react'

import type { Hotkey } from '@/shared/lib/hotkey'

/**
 * What a command is given when it runs: named values of the thing that runs it, such as the id of
 * the document that an answer asks to open. A command from the palette or a hotkey is given none.
 */
export type CommandArguments = Readonly<Record<string, string | null | undefined>>

/**
 * A command that a component registers with `useCommands` while it is mounted. Anything can run it
 * by its id, with `runCommand`, such as the answer to a message that asks the page to open a
 * document. A command with a `label` and a `group` is also listed by the command palette, and
 * one with a `hotkey` runs on it.
 */
export interface Command {
  /** Unique among the commands of the screen, such as `view.toggleSidePanel`. */
  id: string
  /** What the palette lists the command as; without it, and a group, the palette leaves it out. */
  label?: string
  /** The heading that the palette lists the command under, such as `View`. */
  group?: string
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
  run?: (args: CommandArguments) => void
}
