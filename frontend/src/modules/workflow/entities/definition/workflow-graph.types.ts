import { z } from 'zod'

// Temporary hand-written schemas for the graph of the workflow definition.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

// How the types hold one another, from the outside in:
//
//   WorkflowEntry                  the node at which a run starts, by the kind of run
//   WorkflowNode                   one node of the graph, told apart by its `kind`
//   |-- terminal                   `start` and `end`
//   |-- agent                      a step of an agent role, in a stage
//   |-- control                    a step of the workflow itself, in a stage
//   `-- checkpoint                 a pause that asks the user
//       |-- options[]              the decision that chooses the edge to follow
//       `-- questions[]            further questions, each with its choices and default answer
//   WorkflowEdge                   one edge, with the checkpoint option that leads along it

/** The node at which a run starts, by the kind of run. */
export const workflowEntrySchema = z.object({
  first_run: z.string(),
  later_runs: z.string(),
  /** The node a run goes to after any node while messages of the user are pending. */
  pending_messages: z.string(),
})

export type WorkflowEntry = z.infer<typeof workflowEntrySchema>

/** One decision of a checkpoint; each option key matches an edge that leaves the checkpoint. */
export const checkpointOptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  requires_feedback: z.boolean(),
  /** Choosing it approves the artifacts under review, and their items that are still draft. */
  approves: z.boolean(),
  /** Taken without asking when the run does not pause at the checkpoint. */
  is_default: z.boolean(),
})

export type CheckpointOption = z.infer<typeof checkpointOptionSchema>

/** One choice of a select question. */
const questionChoiceSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** Choosing it asks the user to explain it in text, as an "Other" choice does. */
  requires_text: z.boolean(),
})

const questionTypes = ['single_select', 'multi_select', 'free_text', 'number'] as const

/** The answer to a question: the chosen keys for a select, the text, or the number. */
export const questionAnswerSchema = z.object({
  choice_keys: z.array(z.string()),
  text: z.string().nullable(),
  number: z.number().nullable(),
})

export type QuestionAnswer = z.infer<typeof questionAnswerSchema>

/** A further question of a checkpoint, answered together with the option. */
export const checkpointQuestionSchema = z.object({
  key: z.string(),
  type: z.enum(questionTypes),
  prompt: z.string(),
  required: z.boolean(),
  /** At least two for a select question, none for the other types. */
  choices: z.array(questionChoiceSchema),
  /** For a multi-select only: the fewest and the most choices an answer picks; null is no bound. */
  min_selected: z.number().int().nullable(),
  max_selected: z.number().int().nullable(),
  /** The answer taken without asking; null only when the question is not required. */
  default_answer: questionAnswerSchema.nullable(),
})

export type CheckpointQuestion = z.infer<typeof checkpointQuestionSchema>

const terminalNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(['start', 'end']),
  label: z.string(),
})

const agentNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('agent'),
  label: z.string(),
  stage: z.string(),
  agent_role: z.string(),
})

const controlNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('control'),
  label: z.string(),
  stage: z.string(),
})

const checkpointNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('checkpoint'),
  label: z.string(),
  /** The name of the checkpoint as the user reads it. */
  title: z.string(),
  stage: z.string(),
  /** What the user is asked when the run pauses here. */
  prompt: z.string(),
  /** The kinds of the artifacts under review. */
  review_artifact_kinds: z.array(z.string()),
  allow_edits: z.boolean(),
  options: z.array(checkpointOptionSchema),
  questions: z.array(checkpointQuestionSchema),
  /** Whether the agent before the checkpoint may add questions at run time. */
  agent_questions: z.boolean(),
})

export type CheckpointNode = z.infer<typeof checkpointNodeSchema>

export const workflowNodeSchema = z.discriminatedUnion('kind', [
  terminalNodeSchema,
  agentNodeSchema,
  controlNodeSchema,
  checkpointNodeSchema,
])

export type WorkflowNode = z.infer<typeof workflowNodeSchema>

export const workflowEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  /** The condition, as the graph shows it. */
  label: z.string().nullable(),
  conditional: z.boolean(),
  /** The key of the checkpoint option that leads along the edge. */
  option: z.string().nullable(),
})

export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>
