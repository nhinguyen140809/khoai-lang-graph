import type { LucideIcon } from 'lucide-react'

import { DotIcon } from '@/shared/components/icon'
import type { Tone } from '@/shared/lib/tone'
import type { ByView, Wording } from '@/shared/lib/view'
import { routes, userRoutes } from '@/shared/routes'

import type { ProjectFilters, ProjectPages, ProjectStatus } from './projects.types'

// The words of the projects, for their lists and their states, and the filters that narrow nothing.

export const projectMessages = {
  /** The way to the list of every project. */
  all: 'All projects',
  /** The projects of a list or a menu while they load. */
  listLoading: 'Loading projects...',
  /** One project while it loads, such as the open one on a bar. */
  loading: 'Loading the project',
  /** A menu of projects without any. */
  none: 'No projects',
  /** A list of the archived projects without any. */
  noArchived: 'No archived projects',
  /** A list where no project matches the search. */
  noMatch: 'No project matches the search.',
  /** The projects of a menu failed to load; choosing the entry loads them again. */
  listFailed: 'Failed to load projects. Try again',
  /** The project of the address does not exist, or was deleted. */
  notFound: 'Project not found',
  notFoundHint: 'No project exists at this address, or it was deleted.',
  /** The project failed to load for another reason. */
  unavailable: 'Project unavailable',
}

/** The items of the menu of a project, wherever it is offered. */
export const projectActionMessages = {
  rename: 'Rename',
  archive: 'Archive',
  restore: 'Restore',
  delete: 'Delete',
  /** The name of the button that opens the menu, after the name of the project. */
  menu: (name: string) => `Actions for ${name}`,
}

/** The label of each project status in each view, as the list of projects reads it. */
export const projectStatusLabels = {
  active: { developer: 'Active' },
  archived: { developer: 'Archived' },
} as const satisfies Record<ProjectStatus, Wording>

/** The filters of a list of projects that narrow nothing. */
export const noProjectFilters: ProjectFilters = { runStatuses: [], activeWithinDays: null }

/**
 * The pages of the projects in the workbench, which a frame reads until it gives its own with
 * `ProjectPagesProvider`: a project opens at its activity and starts on the list of the projects.
 */
export const workbenchProjectPages: ProjectPages = {
  project: (projectId) => routes.project(projectId).activity(),
  start: () => routes.projects(),
}

/**
 * Where the pages of the projects are on the desk, the frame of the user view, which
 * `DeskProjectPagesProvider` gives: a project opens on its chat, and starts on the start page.
 */
export const deskProjectPages: ProjectPages = {
  project: (projectId) => userRoutes.project(projectId),
  start: () => userRoutes.home(),
}

/** How a project with news shows in a list, in each view: a dot of the primary color. */
export const projectNewsLook = {
  tone: { developer: 'primary' },
  icon: { developer: DotIcon },
  label: { developer: 'New activity' },
} as const satisfies { tone: ByView<Tone>; icon: ByView<LucideIcon>; label: Wording }
