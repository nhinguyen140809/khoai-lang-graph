import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { getWorkflowDefinition } from '../api/workflow.api'
import { workflowKeys } from '../keys/workflow.keys'
import { workflowDefinitionStaleTime } from '../stale-time.constants'
import type { WorkflowDefinition } from '../types/workflow-definition.types'
import { issueKinds } from '../utils/issues.utils'
import {
  reviewableCheckpoints,
  visibleStages,
  visibleStageTitle,
} from '../utils/workflow-definition.utils'

// One request serves every part of a version: a hook picks its part with `select`, so that the
// stages, the titles and the graph of a version share one entry in the cache.
function useDefinitionQuery<Selected>(
  version: number | undefined,
  select: (definition: WorkflowDefinition) => Selected,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: workflowKeys.definition(version),
    queryFn: () => getWorkflowDefinition(version),
    enabled: isEnabled,
    // A version never changes once it exists; the current one changes with a deploy.
    staleTime: version === undefined ? workflowDefinitionStaleTime : Infinity,
    select,
  })
}

/** The `select` of a hook that wants the definition itself, with no part of it picked out. */
function selectDefinition(definition: WorkflowDefinition) {
  return definition
}

/** The workflow definition at a version, or the current one without a version. */
export function useWorkflowDefinition(version?: number) {
  return useDefinitionQuery(version, selectDefinition)
}

/**
 * The title of a stage in a version of the workflow, so that a run reads with the version it ran
 * with. An internal stage gives the title of the stage before it that the user sees. Undefined
 * without a version or a stage, and while the definition loads; nothing loads until a version is
 * given.
 */
export function useStageTitle(
  version: number | undefined,
  stage: string | null,
): string | undefined {
  // A stable function, so that the query does not select again on every render.
  const selectTitle = useCallback(
    (definition: WorkflowDefinition) =>
      stage === null ? null : visibleStageTitle(definition, stage),
    [stage],
  )
  const title = useDefinitionQuery(version, selectTitle, {
    isEnabled: version !== undefined,
  })

  return title.data ?? undefined
}

/**
 * The reviews the user may turn on for a run, one for each checkpoint of the workflow, for the
 * run settings. Without a version it reads the current one, which a new run starts with.
 */
export function useReviewableCheckpoints(version?: number) {
  return useDefinitionQuery(version, reviewableCheckpoints)
}

/**
 * The stages the user sees, as a tree, in a version of the workflow. Nothing loads until a version
 * is given, so that a run shows the stages of the version it ran with.
 */
export function useVisibleStages(version: number | undefined) {
  return useDefinitionQuery(version, visibleStages, { isEnabled: version !== undefined })
}

/**
 * The kinds of item that record a problem to settle, in a version of the workflow, for the lists
 * of open issues. Without a version it reads the current one.
 */
export function useIssueKinds(version?: number) {
  return useDefinitionQuery(version, issueKinds)
}
