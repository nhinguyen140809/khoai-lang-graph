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
