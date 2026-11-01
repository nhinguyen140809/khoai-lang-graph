import type { ArtifactKinds, ContentSchema } from '@/features/artifacts'

import ambiguityIssue from '../data/content-schemas/ambiguity_issue.v1.json'
import analyzedRequirement from '../data/content-schemas/analyzed_requirement.v1.json'
import assumption from '../data/content-schemas/assumption.v1.json'
import backlogItem from '../data/content-schemas/backlog_item.v1.json'
import conflict from '../data/content-schemas/conflict.v1.json'
import elicitationPlan from '../data/content-schemas/elicitation_plan.v1.json'
import interviewMessage from '../data/content-schemas/interview_message.v1.json'
import interviewTranscript from '../data/content-schemas/interview_transcript.v1.json'
import latentNeed from '../data/content-schemas/latent_need.v1.json'
import persona from '../data/content-schemas/persona.v1.json'
import personaCatalog from '../data/content-schemas/persona_catalog.v1.json'
import productBacklog from '../data/content-schemas/product_backlog.v1.json'
import rawRequirement from '../data/content-schemas/raw_requirement.v1.json'
import requirementSpecification from '../data/content-schemas/requirement_specification.v1.json'
import requirementsAnalysis from '../data/content-schemas/requirements_analysis.v1.json'
import section from '../data/content-schemas/section.v1.json'
import specRequirement from '../data/content-schemas/spec_requirement.v1.json'
import validationIssue from '../data/content-schemas/validation_issue.v1.json'
import validationReport from '../data/content-schemas/validation_report.v1.json'
import definition from '../data/workflow/requirements_engineering.v1.json'

// The response of GET /artifact-kinds for workflow definition version 1, built from copies of the
// definition and of the content schemas in src/mocks/data/.

type JsonValue = unknown

/** The content schemas at version 1, by kind. */
const contentSchemas: Record<string, JsonValue> = {
  ambiguity_issue: ambiguityIssue,
  analyzed_requirement: analyzedRequirement,
  assumption,
  backlog_item: backlogItem,
  conflict,
  elicitation_plan: elicitationPlan,
  interview_message: interviewMessage,
  interview_transcript: interviewTranscript,
  latent_need: latentNeed,
  persona,
  persona_catalog: personaCatalog,
  product_backlog: productBacklog,
  raw_requirement: rawRequirement,
  requirement_specification: requirementSpecification,
  requirements_analysis: requirementsAnalysis,
  section,
  spec_requirement: specRequirement,
  validation_issue: validationIssue,
  validation_report: validationReport,
}

function isObject(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// As GET /artifact-kinds serves a schema: a field that names a value list gets the values of that list in
// its `enum`, and their descriptions in its description.
function withValueLists(schema: JsonValue): JsonValue {
  if (Array.isArray(schema)) return schema.map(withValueLists)
  if (!isObject(schema)) return schema
  const served = Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [key, withValueLists(value)]),
  )
  const listKey = served['x-value-list']
  const list = definition.value_lists.find(({ key }) => key === listKey)
  if (list === undefined) return served
  const keys = list.values.map(({ key }) => key)
  const nullable = Array.isArray(served.type) && served.type.includes('null')
  const meanings = list.values.map(({ key, description }) => `${key}: ${description}`).join(' ')
  const description = typeof served.description === 'string' ? `${served.description} ` : ''
  return {
    ...served,
    enum: nullable ? [...keys, null] : keys,
    description: `${description}Values: ${meanings}`,
  }
}

function servedSchema(kind: string): ContentSchema {
  const schema = withValueLists(contentSchemas[kind])
  if (!isObject(schema) || typeof schema.title !== 'string') {
    throw new Error(`No content schema for the kind ${kind}`)
  }
  return schema as ContentSchema
}

function itemKindVersion(kind: string): number {
  return definition.item_kinds.find((itemKind) => itemKind.kind === kind)?.schema_version ?? 1
}

export const mockArtifactKinds: ArtifactKinds = {
  workflow_version: definition.version,
  artifact_kinds: definition.artifact_kinds.map((artifactKind) => ({
    kind: artifactKind.kind,
    schema_version: artifactKind.schema_version,
    schema: servedSchema(artifactKind.kind),
    item_kinds: artifactKind.item_kinds.map((kind) => ({
      kind,
      schema_version: itemKindVersion(kind),
      schema: servedSchema(kind),
    })),
  })),
}
