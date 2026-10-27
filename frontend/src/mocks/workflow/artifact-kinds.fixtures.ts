import {
  type ArtifactKinds,
  type ContentSchema,
  findValueList,
  type KindSchema,
} from '@/modules/workflow/entities'
import { isRecord, isString } from '@/shared/lib/guards'

import { contentSchemaFiles } from './data/content-schemas'
import definition from './requirements_engineering.v1.json'
import { workflowDefinitionFixture } from './workflow.fixtures'

// The response of GET /artifact-kinds for workflow definition version 1, built from copies of the
// definition and of the content schemas (src/mocks/workflow/data/).

// As GET /artifact-kinds serves a schema: a field that names a value list gets the values of that list in
// its `enum`, and their descriptions in its description.
function withValueLists(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(withValueLists)
  if (!isRecord(schema)) return schema
  const served = Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [key, withValueLists(value)]),
  )
  const listKey = served['x-value-list']
  const list = isString(listKey) ? findValueList(workflowDefinitionFixture, listKey) : null
  if (list === null) return served
  const keys = list.values.map(({ key }) => key)
  const isNullable = Array.isArray(served.type) && served.type.includes('null')
  const meanings = list.values.map(({ key, description }) => `${key}: ${description}`).join(' ')
  const description = isString(served.description) ? `${served.description} ` : ''
  return {
    ...served,
    enum: isNullable ? [...keys, null] : keys,
    description: `${description}Values: ${meanings}`,
  }
}

/** The content schema of a kind as the API serves it. */
export function contentSchemaFixtureByKind(kind: string): ContentSchema {
  const schema = withValueLists(contentSchemaFiles[kind])
  if (!isRecord(schema) || typeof schema.title !== 'string') {
    throw new Error(`No content schema for the kind ${kind}`)
  }
  return schema as ContentSchema
}

function itemKindVersion(kind: string): number {
  return definition.item_kinds.find((itemKind) => itemKind.kind === kind)?.schema_version ?? 1
}

export const artifactKindFixtures: ArtifactKinds = {
  workflow_version: definition.version,
  artifact_kinds: definition.artifact_kinds.map((artifactKind) => ({
    kind: artifactKind.kind,
    schema_version: artifactKind.schema_version,
    schema: contentSchemaFixtureByKind(artifactKind.kind),
    item_kinds: artifactKind.item_kinds.map((kind) => ({
      kind,
      schema_version: itemKindVersion(kind),
      schema: contentSchemaFixtureByKind(kind),
    })),
  })),
}

/** The artifact kind with this name, or the item kind. */
export function findKind(kind: string): KindSchema | undefined {
  return artifactKindFixtures.artifact_kinds
    .flatMap((artifactKind) => [artifactKind, ...artifactKind.item_kinds])
    .find((entry) => entry.kind === kind)
}

/** The item kinds that the artifact kind holds. */
export function itemKindsOf(artifactKind: string): KindSchema[] {
  return (
    artifactKindFixtures.artifact_kinds.find((entry) => entry.kind === artifactKind)?.item_kinds ??
    []
  )
}
