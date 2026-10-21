import { subDays } from 'date-fns'

import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/api-fetch.utils'

import { noProjectFilters } from './projects.constants'
import {
  type CreateProjectBody,
  type Project,
  type ProjectFilters,
  projectSchema,
  type ProjectStatus,
} from './projects.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

// The query of GET /projects: the API applies the filters. The period of the last activity is
// counted back from now.
function listQuery(status: ProjectStatus, filters: ProjectFilters): string {
  const params = new URLSearchParams({ status })
  for (const runStatus of filters.runStatuses) params.append('rollup_run_status', runStatus)
  if (filters.activeWithinDays !== null) {
    params.set('last_activity_after', subDays(new Date(), filters.activeWithinDays).toISOString())
  }
  return params.toString()
}

/**
 * One page of the projects of the user with one status, the latest activity first, narrowed by
 * the filters.
 */
export function listProjects(
  status: ProjectStatus,
  cursor: string | null,
  limit: number,
  filters: ProjectFilters = noProjectFilters,
): Promise<ListPage<Project>> {
  return fetchPage(`/api/v1/projects?${listQuery(status, filters)}`, projectSchema, {
    limit,
    cursor,
    action: 'load projects',
  })
}

export function getProject(projectId: string): Promise<Project> {
  return apiRequest(`/api/v1/projects/${encodeURIComponent(projectId)}`, projectSchema, {
    action: 'load the project',
  })
}

export function createProject(body: CreateProjectBody): Promise<Project> {
  return apiRequest('/api/v1/projects', projectSchema, {
    action: 'create the project',
    method: 'POST',
    body,
  })
}

// Archive and Restore both set the status of the project.
function changeProjectStatus(
  projectId: string,
  status: ProjectStatus,
  action: string,
): Promise<Project> {
  return apiRequest(`/api/v1/projects/${encodeURIComponent(projectId)}`, projectSchema, {
    action,
    method: 'PATCH',
    body: { status },
  })
}

/** Archives a project: it leaves the active projects for the archived ones. */
export function archiveProject(projectId: string): Promise<Project> {
  return changeProjectStatus(projectId, 'archived', 'archive the project')
}

/** Makes an archived project active again. */
export function restoreProject(projectId: string): Promise<Project> {
  return changeProjectStatus(projectId, 'active', 'restore the project')
}

/** Gives a project a new name. */
export function renameProject(projectId: string, name: string): Promise<Project> {
  return apiRequest(`/api/v1/projects/${encodeURIComponent(projectId)}`, projectSchema, {
    action: 'rename the project',
    method: 'PATCH',
    body: { name },
  })
}

/** Deletes a project: no list shows it again, and its address finds nothing. */
export function deleteProject(projectId: string): Promise<void> {
  return apiCommand(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
    action: 'delete the project',
    method: 'DELETE',
  })
}
