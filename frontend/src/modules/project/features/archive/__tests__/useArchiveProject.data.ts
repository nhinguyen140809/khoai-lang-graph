import { buildProject } from '@/mocks/projects/projects.fixtures'
import { projectIds } from '@/mocks/shared/db'

/** A project of the mock data, which the cases archive or restore. */
export const mentorProject = buildProject({ id: projectIds.mentor, name: 'Mentor platform' })

/**
 * A change, and the toast it shows with its duration in milliseconds. Without a duration, a toast
 * closes after the default 4 seconds.
 */
export const archiveToastCases = [
  {
    name: 'an archived project, with Undo, for longer than the others',
    change: 'archive',
    message: 'Project archived',
    duration: 10_000,
  },
  {
    name: 'a restored project, for the default time',
    change: 'restore',
    message: 'Project restored',
    duration: undefined,
  },
] as const

/** A change that the server refuses, and the toast that shows the error. */
export const archiveErrorCases = [
  {
    name: 'a failed archive',
    change: 'archive',
    message: 'Failed to archive the project (HTTP 500)',
  },
  {
    name: 'a failed restore',
    change: 'restore',
    message: 'Failed to restore the project (HTTP 500)',
  },
] as const
