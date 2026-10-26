import type { PaletteCommand } from '../command.types'

function command(id: string, group: string): PaletteCommand {
  return { id, label: id, group }
}

/** The commands that each source registers, and the groups: each heading with its command ids. */
export const commandGroupCases = [
  {
    name: 'orders the groups by name and keeps the order of the commands in a group',
    sources: [
      [command('toggle', 'View'), command('console', 'Show')],
      [command('dark', 'View'), command('light', 'View')],
    ],
    groups: [
      ['Show', ['console']],
      ['View', ['toggle', 'dark', 'light']],
    ],
  },
  {
    name: 'puts the commands of one group from several sources together',
    sources: [[command('new', 'Projects')], [command('open', 'Projects')]],
    groups: [['Projects', ['new', 'open']]],
  },
  { name: 'has no group without a command', sources: [[]], groups: [] },
  { name: 'has no group without a source', sources: [], groups: [] },
]

const projects = {
  heading: 'Projects',
  commands: [
    { id: 'projects.open.p1', label: 'Open Student club manager', group: 'Projects' },
    { id: 'projects.new', label: 'Create project', group: 'Projects' },
  ],
}
const run = { heading: 'Run', commands: [{ id: 'run.stop', label: 'Stop run', group: 'Run' }] }
const view = {
  heading: 'View',
  commands: [{ id: 'view.commandPalette', label: 'Show all commands', group: 'View' }],
}

/** The groups in the order of their names, a search, and the headings in the order it lists them. */
export const groupsBySearchCases = [
  {
    name: 'puts first the group of the best match',
    search: 'stop',
    headings: ['Run', 'Projects', 'View'],
  },
  {
    name: 'keeps the order of groups that match as well',
    search: 'zzz',
    headings: ['Projects', 'Run', 'View'],
  },
  { name: 'keeps the order without a search', search: ' ', headings: ['Projects', 'Run', 'View'] },
].map((testCase) => ({ groups: [projects, run, view], ...testCase }))

/** A command that the palette shows, before it changes. */
export const shownCommand: PaletteCommand = {
  id: 'view.darkTheme',
  label: 'Dark theme',
  group: 'View',
  run: () => undefined,
}

/** A change of the command, and whether the key of what the palette shows stays the same. */
export const shownKeyCases: { name: string; command: PaletteCommand; same: boolean }[] = [
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
    command: { id: shownCommand.id, label: shownCommand.label, group: shownCommand.group },
    same: false,
  },
]
