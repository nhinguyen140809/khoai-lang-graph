import type { ProjectFilters, ProjectStatus } from '@/modules/project/entities'

/** A status, the projects its list shows, and the ones it leaves out. */
export const listCases: { status: ProjectStatus; shown: string[]; hidden: string[] }[] = [
  {
    status: 'active',
    shown: ['Mentor platform', 'Campus food ordering', 'Library booking'],
    hidden: ['Dorm laundry booking'],
  },
  { status: 'archived', shown: ['Dorm laundry booking'], hidden: ['Mentor platform'] },
]

/** A project of a list, the items of its menu, and the item that takes it out of the list. */
export const menuCases: {
  status: ProjectStatus
  project: string
  items: string[]
  leave: string
}[] = [
  {
    status: 'active',
    project: 'Mentor platform',
    items: ['Rename', 'Archive', 'Delete'],
    leave: 'Archive',
  },
  {
    status: 'archived',
    project: 'Dorm laundry booking',
    items: ['Rename', 'Restore', 'Delete'],
    leave: 'Restore',
  },
]

/** A project of the active list, and what the cell of its runs says. */
export const rowRunCases = [
  { project: 'Mentor platform', run: 'Waiting for you' },
  { project: 'Library booking', run: 'Working' },
  { project: 'Campus food ordering', run: 'Done' },
  { project: 'Thesis tracker', run: 'Not started' },
]

/** A status whose list is empty, and what says so. */
export const emptyListCases: { status: ProjectStatus; text: string }[] = [
  { status: 'active', text: 'No projects yet' },
  { status: 'archived', text: 'No archived projects.' },
]

/** Filters of the active list, the projects they keep, and some that they leave out. */
export const filteredListCases: {
  name: string
  filters: ProjectFilters
  shown: string[]
  hidden: string[]
}[] = [
  {
    name: 'a review that waits',
    filters: { runStatuses: ['interrupted'], activeWithinDays: null },
    shown: ['Mentor platform'],
    hidden: ['Library booking', 'Campus food ordering'],
  },
  {
    name: 'no run yet, or a run that works',
    filters: { runStatuses: ['none', 'running'], activeWithinDays: null },
    shown: ['Thesis tracker', 'Library booking'],
    hidden: ['Mentor platform'],
  },
]
