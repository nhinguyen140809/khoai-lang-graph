import { z } from 'zod'

import { exportTemplateSchema } from './export-templates.types'
import { workflowEdgeSchema, workflowEntrySchema, workflowNodeSchema } from './workflow-graph.types'
import {
  agentRoleSchema,
  definedArtifactKindSchema,
  definedItemKindSchema,
  directiveKindSchema,
  linkTypeSchema,
  toolSchema,
  valueListSchema,
  workflowStageSchema,
} from './workflow-vocabulary.types'

// Temporary hand-written schema for GET /workflow/definition.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** A JSON Schema whose instances are objects: the run parameters, or the workflow state. */
const objectSchemaSchema = z.looseObject({
  type: z.literal('object'),
  properties: z.record(z.string(), z.unknown()),
})

export type ObjectSchema = z.infer<typeof objectSchemaSchema>

/**
 * One version of the workflow: its graph, the names that its runs may store, and the schemas of its
 * run parameters and of its state. A version never changes once a run has used it.
 */
export const workflowDefinitionSchema = z.object({
  name: z.string(),
  version: z.number().int(),
  description: z.string(),
  entry: workflowEntrySchema,
  agent_roles: z.array(agentRoleSchema),
  stages: z.array(workflowStageSchema),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  artifact_kinds: z.array(definedArtifactKindSchema),
  item_kinds: z.array(definedItemKindSchema),
  link_types: z.array(linkTypeSchema),
  /** Absent from a version that has no tools. */
  tools: z.array(toolSchema).default([]),
  value_lists: z.array(valueListSchema),
  directive_kinds: z.array(directiveKindSchema),
  export_templates: z.array(exportTemplateSchema),
  run_parameters_schema: objectSchemaSchema,
  state_schema: objectSchemaSchema,
})

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>
