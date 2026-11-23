'use client'

import { useCallback } from 'react'

import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import type { WorkflowDefinition } from '../../definition/workflow-definition.types'
import type { Tool } from '../../definition/workflow-vocabulary.types'
import type { WorkflowRef } from '../../workflow-ref/workflow-ref.types'
import { findTool } from '../tools.utils'

/** The tool of a workflow at a version with this key; undefined while it loads, without a workflow, and for a key it does not list. */
export function useTool(workflow: WorkflowRef | undefined, key: string): Tool | undefined {
  // A stable function, so that the query does not select again on every render.
  const selectTool = useCallback(
    (definition: WorkflowDefinition) => findTool(definition, key),
    [key],
  )
  return useDefinitionQuery(workflow, selectTool, { isEnabled: workflow !== undefined }).data
}
