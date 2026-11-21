'use client'

import { useCallback } from 'react'

import type { WorkflowDefinition } from '../workflow-definition.types'
import { findTool } from '../workflow-definition.utils'
import type { Tool } from '../workflow-vocabulary.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The tool of a version of the workflow with this key; undefined while it loads, without a version, and for a key it does not list. */
export function useTool(version: number | undefined, key: string): Tool | undefined {
  // A stable function, so that the query does not select again on every render.
  const selectTool = useCallback(
    (definition: WorkflowDefinition) => findTool(definition, key),
    [key],
  )
  return useDefinitionQuery(version, selectTool, { isEnabled: version !== undefined }).data
}
