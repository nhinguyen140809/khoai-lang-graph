import type { Project } from '@/modules/project/entities'

import { mockState } from '../shared/db'

// Projects created with POST /projects.
export const createdProjects = mockState<Project[]>('created-projects', () => [])
// The fields of a project changed since, by its id, such as the status that PATCH sets.
export const projectEdits = mockState<Record<string, Partial<Project>>>(
  'project-changes',
  () => ({}),
)
// The projects that DELETE removed. The API keeps them, but no request finds them again.
export const deletedProjectIds = mockState<string[]>('deleted-projects', () => [])
