import { z } from 'zod'

// Temporary hand-written schemas for the names that one version of the workflow defines and that a
// run may store: the agent roles, the stages, the kinds of artifacts and items, the link types, the
// value lists and the directive kinds.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** A role that an agent node plays, such as `interviewer`; the model of an agent is chosen by its role. */
export const agentRoleSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  prompt_version: z.number().int(),
})

export type AgentRole = z.infer<typeof agentRoleSchema>

/** A position a run can be in, such as `interviewing`. The stages come in the order of the workflow. */
export const workflowStageSchema = z.object({
  key: z.string(),
  /** The name of the stage as the user reads it. */
  title: z.string(),
  /** A step of the system that the user does not see; the pages for the user skip it. */
  internal: z.boolean(),
  /** The stage that this one belongs to, or null at the top level; the stages make a tree. */
  parent: z.string().nullable(),
})

export type WorkflowStage = z.infer<typeof workflowStageSchema>

/**
 * How many artifacts of a kind a project has: `one`; `one_per_subject`, one for each subject item,
 * such as an interview for each persona; or `many`.
 */
const artifactsPerProject = ['one', 'one_per_subject', 'many'] as const

/** An artifact kind as the workflow defines it: its stage, how many a project has, its items. */
export const definedArtifactKindSchema = z.object({
  kind: z.string(),
  schema_version: z.number().int(),
  /** The stage that produces it; artifacts are listed in the order of these stages. */
  stage: z.string(),
  per_project: z.enum(artifactsPerProject),
  /** The kind of the subject item, when there is one artifact for each subject item. */
  subject_item_kind: z.string().nullable(),
  item_kinds: z.array(z.string()),
})

export type DefinedArtifactKind = z.infer<typeof definedArtifactKindSchema>

/** Where the content of an issue says whether it is still open, and the link types that tie it to what it is about. */
const issueRuleSchema = z.object({
  status_field: z.string(),
  open_values: z.array(z.string()).min(1),
  /** The keys of the link types that tie an issue of the kind to the items it is about. */
  about_link_types: z.array(z.string()),
  /** The keys of the link types that tie an issue of the kind to the people it involves. */
  party_link_types: z.array(z.string()),
})

/**
 * An item kind as the workflow defines it, with the version of the schema of its content. `issue`
 * is set for a kind that records a problem to settle, such as a conflict.
 */
export const definedItemKindSchema = z.object({
  kind: z.string(),
  schema_version: z.number().int(),
  issue: issueRuleSchema.nullable(),
})

export type DefinedItemKind = z.infer<typeof definedItemKindSchema>

/** `any` is every item kind but a section; `same`, as a target, is the kind of the source. */
const linkEndSchema = z.union([z.array(z.string()), z.enum(['any', 'same'])])

/** A pair of item kinds that a link type may connect. */
const linkPairSchema = z.object({ source: linkEndSchema, target: linkEndSchema })

/** Which side of a link of this type may quote the words of its item: the source, the target. */
export const linkQuotesSchema = z.object({
  source: z.boolean(),
  target: z.boolean(),
})

export type LinkQuotes = z.infer<typeof linkQuotesSchema>

/** A kind of link between two items, such as `derived_from`, and the pairs of kinds it may connect. */
export const linkTypeSchema = z.object({
  key: z.string(),
  title: z.string(),
  /** Following links of the type from an item never returns to it. */
  acyclic: z.boolean(),
  /** Only the agents create links of the type, during a run; the user never starts one by hand. */
  agent_only: z.boolean(),
  pairs: z.array(linkPairSchema),
  /** Which side of a link of this type may quote words. */
  quotes: linkQuotesSchema,
})

export type LinkType = z.infer<typeof linkTypeSchema>

/** A kind of link that an item of one kind may start, with its title and the kinds it may lead to. */
export interface LinkTypeChoice {
  key: string
  title: string
  targetKinds: string[]
}

/** The marks a client draws for a tool: its own, or the plain one. */
export const toolIcons = ['search', 'tool'] as const

/** A tool that an agent may use while it works, with the words for its uses in a row. */
export const toolSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  /** The line for the uses of the tool in a row: one use, or several, where `{count}` is the number. */
  uses: z.object({ one: z.string(), other: z.string() }),
  icon: z.enum(toolIcons),
})

export type Tool = z.infer<typeof toolSchema>

/** A named list of values that a content field takes its value from. */
export const valueListSchema = z.object({
  key: z.string(),
  title: z.string(),
  values: z.array(z.object({ key: z.string(), title: z.string(), description: z.string() })),
})

export type ValueList = z.infer<typeof valueListSchema>

/**
 * A kind of directive: an instruction that a node writes for the run to follow, such as the rework
 * that sends the interview back to some personas. The run loops because of its directives.
 */
export const directiveKindSchema = z.object({
  kind: z.string(),
  title: z.string(),
  /** The roles an item can have in a directive of this kind. */
  item_roles: z.array(z.string()),
  /** The JSON Schema of the details of a directive of this kind. */
  details_schema: z.record(z.string(), z.unknown()),
})

export type DirectiveKind = z.infer<typeof directiveKindSchema>
