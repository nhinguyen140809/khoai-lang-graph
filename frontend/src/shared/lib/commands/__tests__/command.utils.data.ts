import type { Command } from '../command.types'

/** A command that the palette shows, before it changes. */
export const shownCommand: Command = {
  id: 'view.darkTheme',
  label: 'Dark theme',
  group: 'View',
  run: () => undefined,
}

/** A change of the command, and whether the key of what the palette shows stays the same. */
export const shownKeyCases: { name: string; command: Command; same: boolean }[] = [
  {
    name: 'keeps the key when only the function to run is new',
    command: { ...shownCommand, run: () => undefined },
    same: true,
  },
  {
    name: 'keeps the key when only the icon is new',
    command: { ...shownCommand, icon: 'Moon' },
    same: true,
  },
  {
    name: 'changes the key with the label',
    command: { ...shownCommand, label: 'Night' },
    same: false,
  },
  {
    name: 'changes the key with the group',
    command: { ...shownCommand, group: 'Theme' },
    same: false,
  },
  {
    name: 'changes the key with the hotkey',
    command: { ...shownCommand, hotkey: { key: 'd', mod: true } },
    same: false,
  },
  {
    name: 'changes the key when the command no longer runs',
    command: { id: shownCommand.id, label: 'Dark theme', group: 'View' },
    same: false,
  },
]
