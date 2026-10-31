import { projectIds } from '@/mocks/shared/db'
import type { View } from '@/shared/lib/view'

/**
 * A page address (its scenario), a project of the mock data, and what the status shows for its
 * run: the label with the title of the stage, the fill of its badge, and whether Stop shows.
 */
export const projectStatusCases = [
  {
    name: 'a run that waits for a review, with its stage',
    address: '/',
    projectId: projectIds.mentor,
    status: 'Waiting for you: Reviewing the analysis',
    fill: 'solid',
    hasStop: true,
  },
  {
    name: 'a run that works',
    address: '/?mock-run-status=running',
    projectId: projectIds.mentor,
    status: 'Working: Analysing the interviews',
    fill: 'soft',
    hasStop: true,
  },
  {
    name: 'a run that failed, with the stage it failed at',
    address: '/?mock-run-status=failed',
    projectId: projectIds.mentor,
    status: 'Failed: Analysing the interviews',
    fill: 'solid',
    hasStop: false,
  },
  {
    name: 'a run that is done, with no stage',
    address: '/?mock-run-status=done',
    projectId: projectIds.mentor,
    status: 'Done',
    fill: 'soft',
    hasStop: false,
  },
  {
    name: 'a run of another project that works',
    address: '/',
    projectId: projectIds.library,
    status: 'Working: Interviewing',
    fill: 'soft',
    hasStop: true,
  },
  {
    name: 'a project without a run',
    address: '/?mock-runs=empty',
    projectId: projectIds.mentor,
    status: 'Not started',
    fill: 'soft',
    hasStop: false,
  },
] as const

/** A view of the app, a page address, and what the status says in that view. */
export const viewCases: { view: View; address: string; status: string }[] = [
  { view: 'user', address: '/', status: 'Waiting for you: Reviewing the analysis' },
  { view: 'developer', address: '/', status: 'Waiting for review: Reviewing the analysis' },
  { view: 'user', address: '/?mock-runs=empty', status: 'Not started' },
  { view: 'developer', address: '/?mock-runs=empty', status: 'No run yet' },
]
