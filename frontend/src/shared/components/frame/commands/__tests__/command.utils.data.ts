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
].map((testCase) => ({ ...testCase, groups: [projects, run, view] }))
