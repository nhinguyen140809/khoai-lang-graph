import { apiRequest } from '@/lib/api-fetch.utils'

import { workflowDefinitionSchema } from './definition.types'

/** The workflow definition of one version (API.md); the graph is drawn from
 * its nodes and edges, the export dialog from its templates. */
export function getWorkflowDefinition(version: number | null) {
  const query = version === null ? '' : `?version=${encodeURIComponent(version)}`
  return apiRequest(`/api/v1/workflow/definition${query}`, workflowDefinitionSchema, {
    action: 'load the workflow definition',
  })
}
