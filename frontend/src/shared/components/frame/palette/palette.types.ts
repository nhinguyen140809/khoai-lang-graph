import type { Command } from '@/shared/lib/commands'

/** A command that the command palette lists: one with a label and a group. */
export type PaletteCommand = Command & { label: string; group: string }

export interface PaletteCommandGroup {
  heading: string
  commands: PaletteCommand[]
}
