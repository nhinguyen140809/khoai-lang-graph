import { apiRequest, fetchAllPages } from '@/shared/api/api-fetch.utils'
import { runConfigDefinitionSchema } from '@/shared/components/run-config'

import {
  modelEntrySchema,
  type ProjectPatch,
  settingsProjectSchema,
} from './project-settings.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

const id = encodeURIComponent

export function getSettingsProject(projectId: string) {
  return apiRequest(`/api/v1/projects/${id(projectId)}`, settingsProjectSchema, {
    action: 'load the project',
  })
}

export function patchProject(projectId: string, patch: ProjectPatch) {
  return apiRequest(`/api/v1/projects/${id(projectId)}`, settingsProjectSchema, {
    action: 'save the settings',
    method: 'PATCH',
    body: patch,
  })
}

/** The current version of the workflow definition. */
export function getCurrentDefinition() {
  return apiRequest('/api/v1/workflow/definition', runConfigDefinitionSchema, {
    action: 'load the workflow definition',
  })
}

export function listModels() {
  return fetchAllPages('/api/v1/models', modelEntrySchema, 'load the models')
}
