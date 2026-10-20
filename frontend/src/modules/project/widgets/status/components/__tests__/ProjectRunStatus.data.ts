import { IdPrefix, mockId, PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'

// A project of the mock data beyond the first four, by its number.
const extraProject = (n: number) => mockId(IdPrefix.Project, n)

/** A project of the mock data, and the status that the status bar shows. */
export const projectStatusCases = [
  {
    name: 'a run that waits for a review, with its stage',
    projectId: PROJECT_IDS.mentor,
    status: 'Waiting for you: Analysis review',
  },
  {
    name: 'a run that works',
    projectId: PROJECT_IDS.library,
    status: 'Working: Interviewing',
  },
  {
    name: 'a run near its cost limit, without its cost',
    projectId: extraProject(7),
    status: 'Working: Interviewing',
  },
  {
    name: 'a run that failed, with the stage it failed at',
    projectId: extraProject(8),
    status: 'Failed: Analysis',
  },
  {
    name: 'a run that was stopped',
    projectId: extraProject(10),
    status: 'Stopped: Interviewing',
  },
  { name: 'a run that is done', projectId: PROJECT_IDS.campus, status: 'Done' },
  {
    name: 'a project without a run',
    projectId: extraProject(12),
    status: 'Not started',
  },
]

/** The state of the run of the mentor platform, and whether Stop shows beside its status. */
export const stopButtonCases = [
  { state: 'waiting for review', address: '/', shown: true },
  { state: 'running', address: '/?mock-run-state=running', shown: true },
  { state: 'about to start', address: '/?mock-run-state=queued', shown: true },
  { state: 'failed', address: '/?mock-run-state=failed', shown: false },
  { state: 'done', address: '/?mock-run-state=done', shown: false },
]
