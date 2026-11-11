'use client'

import { toolsOf } from '../workflow-definition.utils'
import type { Tool } from '../workflow-vocabulary.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The tools of a version of the workflow, by their key; empty while it loads. */
export function useTools(version: number | undefined): ReadonlyMap<string, Tool> {
  const tools = useDefinitionQuery(version, toolsOf, { isEnabled: version !== undefined })
  return tools.data ?? new Map()
}
