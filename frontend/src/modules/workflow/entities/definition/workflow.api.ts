import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { type WorkflowDefinition, workflowDefinitionSchema } from './workflow-definition.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/**
 * The workflow definition: the current version, or the one that `version` names, such as the
 * version a run ran with.
 */
export function getWorkflowDefinition(version?: number): Promise<WorkflowDefinition> {
  return apiRequest(
    pathWithQuery(apiEndpoints.workflowDefinition.path(), { version }),
    workflowDefinitionSchema,
    { action: 'load the workflow' },
  )
}
