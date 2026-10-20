import { z } from 'zod'

// Temporary hand-written schemas for the workflow API: the stages of the workflow that the runs go
// through.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** A stage of the workflow, which a run goes through, with the label that the screens show. */
export const workflowStageSchema = z.object({ key: z.string(), label: z.string() })

export type WorkflowStage = z.infer<typeof workflowStageSchema>

// The part of the workflow definition that names its stages.
export const workflowStagesSchema = z.object({ stages: z.array(workflowStageSchema) })
