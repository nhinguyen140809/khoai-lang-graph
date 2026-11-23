import { useCallback } from 'react'

import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import type { WorkflowDefinition } from '../../definition/workflow-definition.types'
import type { WorkflowRef } from '../../workflow-ref/workflow-ref.types'
import { visibleStages, visibleStageTitle } from '../stages.utils'

/**
 * The title of a stage in a version of the workflow, so that a run reads with the version it ran
 * with. An internal stage gives the title of the stage before it that the user sees. Undefined
 * without a version or a stage, and while the definition loads; nothing loads until a version is
 * given.
 */
export function useStageTitle(
  workflow: WorkflowRef | undefined,
  stage: string | null,
): string | undefined {
  // A stable function, so that the query does not select again on every render.
  const selectTitle = useCallback(
    (definition: WorkflowDefinition) =>
      stage === null ? null : visibleStageTitle(definition, stage),
    [stage],
  )
  const title = useDefinitionQuery(workflow, selectTitle, { isEnabled: workflow !== undefined })

  return title.data ?? undefined
}

/**
 * The stages the user sees, as a tree, in a version of the workflow. Nothing loads until a version
 * is given, so that a run shows the stages of the version it ran with.
 */
export function useVisibleStages(workflow: WorkflowRef | undefined) {
  return useDefinitionQuery(workflow, visibleStages, { isEnabled: workflow !== undefined })
}
