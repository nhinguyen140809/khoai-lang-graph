import type { WorkflowDefinition } from '../definition/workflow-definition.types'
import type { Tool } from '../definition/workflow-vocabulary.types'

/** The tool of a definition with this key, or undefined when it lists none. */
export function findTool(
  definition: Pick<WorkflowDefinition, 'tools'>,
  key: string,
): Tool | undefined {
  return definition.tools.find((tool) => tool.key === key)
}

/**
 * The acts to show around the agent at work: those of the tool in use when it names some, else
 * those of the stage; none when neither names any.
 */
export function actsOf(
  definition: Pick<WorkflowDefinition, 'stages' | 'tools'>,
  { stage, tool }: { stage: string | null; tool: string | null },
): string[] {
  const ofTool = tool === null ? [] : (findTool(definition, tool)?.acts ?? [])
  if (ofTool.length > 0) return ofTool
  return definition.stages.find(({ key }) => key === stage)?.acts ?? []
}
