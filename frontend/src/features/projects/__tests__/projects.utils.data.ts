/** The name of a project, and how the pages show it. */
export const projectNameCases = [
  { name: 'a project with a name', project: { name: 'Mentor platform' }, shown: 'Mentor platform' },
  { name: 'a project not named yet', project: { name: null }, shown: 'Untitled project' },
]

/** The unfinished runs of a project, by status, and how many they are. */
export const unfinishedRunCountCases = [
  { name: 'no run', counts: { queued: 0, running: 0, interrupted: 0 }, count: 0 },
  { name: 'a review that waits', counts: { queued: 0, running: 0, interrupted: 1 }, count: 1 },
  { name: 'runs of every status', counts: { queued: 1, running: 2, interrupted: 1 }, count: 4 },
]

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
