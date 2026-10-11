import { z } from 'zod'

// The workflow definition as GET /workflow/definition serves it (docs/API.md
// §Workflow definition). The graph, the checkpoint options and the export
// templates all come from this one document.

export const workflowDefinitionNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(['start', 'end', 'agent', 'checkpoint', 'control']),
  label: z.string(),
  stage: z.string().nullable().optional(),
  agent_role: z.string().nullable().optional(),
  prompt: z.string().optional(),
  allow_edits: z.boolean().optional(),
  options: z.array(z.record(z.string(), z.unknown())).optional(),
})
export type WorkflowDefinitionNode = z.infer<typeof workflowDefinitionNodeSchema>

export const workflowDefinitionEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().nullable().optional(),
  conditional: z.boolean().optional(),
  option: z.string().nullable().optional(),
})
export type WorkflowDefinitionEdge = z.infer<typeof workflowDefinitionEdgeSchema>

const exportTemplateSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  formats: z.array(z.string()),
})

export const workflowDefinitionSchema = z.object({
  name: z.string(),
  version: z.number().int(),
  nodes: z.array(workflowDefinitionNodeSchema),
  edges: z.array(workflowDefinitionEdgeSchema),
  export_templates: z.array(exportTemplateSchema).optional(),
})
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>
