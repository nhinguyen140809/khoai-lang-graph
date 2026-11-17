import { noProjectFilters, type ProjectFilters } from '@/modules/project/entities'

/** The values chosen in the filters of the project list, and the filters they give. */
export const projectFiltersCases = [
  { name: 'no value', values: {}, filters: { runStatuses: [], activeWithinDays: null } },
  {
    name: 'statuses and a period',
    values: { 'run-status': ['interrupted', 'none'], 'last-activity': ['7'] },
    filters: { runStatuses: ['interrupted', 'none'], activeWithinDays: 7 },
  },
  {
    name: 'a status that does not exist, left out',
    values: { 'run-status': ['paused', 'failed'] },
    filters: { runStatuses: ['failed'], activeWithinDays: null },
  },
]

/** Filters of the project list, and whether they narrow it. */
export const isFilteredCases = [
  { name: 'no filter', filters: noProjectFilters, filtered: false },
  { name: 'a period', filters: { runStatuses: [], activeWithinDays: 1 }, filtered: true },
  {
    name: 'a status',
    filters: { runStatuses: ['failed'], activeWithinDays: null },
    filtered: true,
  },
] satisfies { name: string; filters: ProjectFilters; filtered: boolean }[]
