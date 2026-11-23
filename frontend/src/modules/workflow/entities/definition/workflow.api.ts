import { apiEndpoints } from '@/shared/api/endpoints'
import { apiRequest } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { type WorkflowDefinition, workflowDefinitionSchema } from './workflow-definition.types'
import type { WorkflowRef } from './workflow-ref.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/**
 * The workflow definition: the current one of the requirements workflow, or the version of the
 * workflow that `workflow` names, such as the one a run ran with.
 */
export function getWorkflowDefinition(workflow?: WorkflowRef): Promise<WorkflowDefinition> {
  return apiRequest(
    pathWithQuery(apiEndpoints.workflowDefinition.path(), {
      version: workflow?.version,
      name: workflow?.name,
    }),
    workflowDefinitionSchema,
    { action: 'load the workflow' },
  )
}
