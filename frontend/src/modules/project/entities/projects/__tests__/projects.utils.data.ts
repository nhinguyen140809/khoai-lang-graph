import type { Project, ProjectStatus } from '../projects.types'

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

/** Projects, a search, and the ids of the projects that it keeps. */
export const searchCases: {
  name: string
  projects: Pick<Project, 'id' | 'name'>[]
  search: string
  ids: string[]
}[] = [
  {
    name: 'no search, every project',
    projects: [
      { id: 'a', name: 'Mentor platform' },
      { id: 'b', name: null },
    ],
    search: '  ',
    ids: ['a', 'b'],
  },
  {
    name: 'a part of a name, whatever its case',
    projects: [
      { id: 'a', name: 'Mentor platform' },
      { id: 'b', name: 'Library booking' },
    ],
    search: 'PLAT',
    ids: ['a'],
  },
  {
    name: 'a name without its accents',
    projects: [
      { id: 'a', name: 'Quản lý ký túc xá' },
      { id: 'b', name: 'Bike sharing' },
    ],
    search: 'ky tuc',
    ids: ['a'],
  },
  {
    name: 'a project without a name, by the name it shows',
    projects: [{ id: 'a', name: null }],
    search: 'untitled',
    ids: ['a'],
  },
  {
    name: 'nothing that matches',
    projects: [{ id: 'a', name: 'Mentor platform' }],
    search: 'thesis',
    ids: [],
  },
]

/** A list, a search, and what the list says when it shows no project. */
export const emptyCases: { status: ProjectStatus; search: string; text: string }[] = [
  { status: 'active', search: '', text: 'No projects' },
  { status: 'archived', search: '', text: 'No archived projects' },
  { status: 'archived', search: 'mentor', text: 'No project matches the search.' },
]

/** The last activity seen of a project, its last activity, and whether it has news. */
export const hasNewsCases: {
  name: string
  seenAt: string | undefined
  activityAt: string
  news: boolean
}[] = [
  {
    name: 'a project never seen',
    seenAt: undefined,
    activityAt: '2026-11-02T10:00:00Z',
    news: false,
  },
  {
    name: 'activity after the last one seen',
    seenAt: '2026-11-01T10:00:00Z',
    activityAt: '2026-11-02T10:00:00Z',
    news: true,
  },
  {
    name: 'the activity seen',
    seenAt: '2026-11-02T10:00:00Z',
    activityAt: '2026-11-02T10:00:00Z',
    news: false,
  },
]
