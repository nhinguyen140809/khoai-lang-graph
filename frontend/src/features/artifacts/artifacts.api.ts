import { apiRequest, fetchAllPages } from '@/shared/api/api-fetch.utils'

import {
  artifactKindsSchema,
  artifactSchema,
  contentSchemaSchema,
  definitionSummarySchema,
  exportSchema,
  itemSchema,
  outlineItemSchema,
  revisionSchema,
  traceSchema,
} from './artifacts.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

const id = encodeURIComponent

/** The artifact kinds and their item kinds, each with its content schema. */
export function getArtifactKinds() {
  return apiRequest('/api/v1/artifact-kinds', artifactKindsSchema, {
    action: 'load the artifact kinds',
  })
}

/** The artifacts of a project, in the order of the stages that make them. */
export function listProjectArtifacts(projectId: string) {
  return fetchAllPages(
    `/api/v1/projects/${id(projectId)}/artifacts`,
    artifactSchema,
    'load the artifacts',
  )
}

export function getArtifact(artifactId: string) {
  return apiRequest(`/api/v1/artifacts/${id(artifactId)}`, artifactSchema, {
    action: 'load the artifact',
  })
}

/** The items of an artifact in outline order. */
export function listArtifactItems(artifactId: string) {
  return fetchAllPages(
    `/api/v1/artifacts/${id(artifactId)}/items`,
    outlineItemSchema,
    'load the items of the artifact',
  )
}

export function getItem(itemId: string) {
  return apiRequest(`/api/v1/items/${id(itemId)}`, itemSchema, { action: 'load the item' })
}

/** Changes fields of an item; `version` is the version that the change is based on. */
export function updateItem(itemId: string, version: number, content: Record<string, unknown>) {
  return apiRequest(`/api/v1/items/${id(itemId)}`, itemSchema, {
    action: 'save the item',
    method: 'PATCH',
    body: { content },
    headers: { 'If-Match': String(version) },
  })
}

/** The versions of an item, newest first. */
export function listItemRevisions(itemId: string) {
  return fetchAllPages(
    `/api/v1/items/${id(itemId)}/revisions`,
    revisionSchema,
    'load the versions of the item',
  )
}

/** Makes an old version of an item current again, as a new version. */
export function restoreItem(itemId: string, version: number) {
  return apiRequest(`/api/v1/items/${id(itemId)}/restore`, itemSchema, {
    action: 'restore the item',
    method: 'POST',
    body: { version },
  })
}

/** The items that an item comes from and the items made from it, with the links between them. */
export function getItemTrace(itemId: string) {
  return apiRequest(`/api/v1/items/${id(itemId)}/trace?direction=both&depth=1`, traceSchema, {
    action: 'load the trace of the item',
  })
}

/** The export templates and the link types of the current workflow definition. */
export function getDefinitionSummary() {
  return apiRequest('/api/v1/workflow/definition', definitionSummarySchema, {
    action: 'load the workflow definition',
  })
}

export function createExport(projectId: string, template: string, format: string) {
  return apiRequest(`/api/v1/projects/${id(projectId)}/exports`, exportSchema, {
    action: 'ask for the export',
    method: 'POST',
    body: { template, format },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
}

export function getExport(exportId: string) {
  return apiRequest(`/api/v1/exports/${id(exportId)}`, exportSchema, { action: 'load the export' })
}

/** The content schema of a kind at one version, for an item written with an older one. */
export function getContentSchema(kind: string, version: number) {
  return apiRequest(`/api/v1/content-schemas/${id(kind)}/${String(version)}`, contentSchemaSchema, {
    action: 'load the content schema',
  })
}
