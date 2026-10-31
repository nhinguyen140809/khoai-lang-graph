import type { Wording } from '@/shared/lib/view'

import type { ProjectFilters, ProjectStatus } from './projects.types'

// The words of the projects, for their lists and their states, and the filters that narrow nothing.

export const projectMessages = {
  /** The way to the list of every project. */
  all: 'All projects',
  /** The projects of a list or a menu while they load. */
  listLoading: 'Loading projects...',
  /** A menu of projects without any. */
  none: 'No projects',
  /** The projects of a menu failed to load; choosing the entry loads them again. */
  listFailed: 'Failed to load projects. Try again',
  /** The project of the address does not exist, or was deleted. */
  notFound: 'Project not found',
  notFoundHint: 'No project exists at this address, or it was deleted.',
  /** The project failed to load for another reason. */
  unavailable: 'Project unavailable',
}

/** The label of each project status in each view, as the list of projects reads it. */
export const projectStatusLabels = {
  active: { developer: 'Active', user: 'Active' },
  archived: { developer: 'Archived', user: 'Archived' },
} as const satisfies Record<ProjectStatus, Wording>

/** The filters of a list of projects that narrow nothing. */
export const noProjectFilters: ProjectFilters = { runStatuses: [], activeWithinDays: null }
