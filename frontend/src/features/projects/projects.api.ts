import { apiRequest, fetchAllPages } from '@/shared/api/api-fetch.utils'

import {
  type CreateProjectBody,
  type Project,
  projectDefaultsSchema,
  projectSchema,
  type ProjectStatus,
} from './projects.types'

// TODO: switch to the generated client in src/api/generated/ once it is generated.

export function listProjects(status: ProjectStatus): Promise<Project[]> {
  return fetchAllPages(`/api/v1/projects?status=${status}`, projectSchema, 'load projects')
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

export function getProjectDefaults() {
  return apiRequest('/api/v1/me/settings', projectDefaultsSchema, {
    action: 'load your settings',
  })
}
