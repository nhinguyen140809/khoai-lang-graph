import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod } from '@/shared/api/http'
import { apiCommand, apiRequest, fetchPage, type ListPage } from '@/shared/api/request'
import { pathWithQuery } from '@/shared/lib/url'

import { itemFilterParams } from '../artifacts/filter-params.utils'
import {
  type ArtifactItem,
  type ArtifactItemFilters,
  type CreateItemBody,
  itemSchema,
  type MoveItemBody,
  type NestedOutlineItem,
  nestedOutlineItemSchema,
  type OutlineItem,
  outlineItemSchema,
  type ProjectItemFilters,
  type UpdateItemBody,
} from './items.types'

// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

function artifactItemsPath(artifactId: string, filters: ArtifactItemFilters, shape?: 'tree') {
  return pathWithQuery(apiEndpoints.artifactItems.path({ artifactId }), {
    ...itemFilterParams(filters),
    parent_item_id: filters.parentItemId,
    shape,
    version: filters.version,
  })
}

/**
 * One page of the items of an artifact in outline order: a section, then what it contains; with
 * `version` in the filters, the items as they were at that version of the artifact.
 */
export function listArtifactItems(
  artifactId: string,
  cursor: string | null,
  limit: number,
  filters: ArtifactItemFilters = {},
): Promise<ListPage<OutlineItem>> {
  return fetchPage(artifactItemsPath(artifactId, filters), outlineItemSchema, {
    limit,
    cursor,
    action: 'load the items of the artifact',
  })
}

/**
 * One page of the items of an artifact with each item holding the items inside it as `children`;
 * the page lists the top level.
 */
export function listNestedArtifactItems(
  artifactId: string,
  cursor: string | null,
  limit: number,
  filters: ArtifactItemFilters = {},
): Promise<ListPage<NestedOutlineItem>> {
  return fetchPage(artifactItemsPath(artifactId, filters, 'tree'), nestedOutlineItemSchema, {
    limit,
    cursor,
    action: 'load the nested items of the artifact',
  })
}

/** One page of the items of all the artifacts of a project, ordered by key. */
export function listProjectItems(
  projectId: string,
  cursor: string | null,
  limit: number,
  filters: ProjectItemFilters = {},
): Promise<ListPage<ArtifactItem>> {
  const path = pathWithQuery(apiEndpoints.projectItems.path({ projectId }), {
    ...itemFilterParams(filters),
    run_id: filters.runId,
    q: filters.text,
  })
  return fetchPage(path, itemSchema, {
    limit,
    cursor,
    action: 'load the items',
  })
}

/** One item; with `version`, the item as it was at that version, also one deleted since. */
export function getItem(itemId: string, version?: number): Promise<ArtifactItem> {
  return apiRequest(pathWithQuery(apiEndpoints.item.path({ itemId }), { version }), itemSchema, {
    action: 'load the item',
  })
}

/** Makes an item by hand, last under its parent. */
export function createItem(artifactId: string, item: CreateItemBody): Promise<ArtifactItem> {
  return apiRequest(apiEndpoints.artifactItems.path({ artifactId }), itemSchema, {
    action: 'add the item',
    method: HttpMethod.Post,
    body: item,
  })
}

/**
 * Changes fields of an item; `version` is the version that the change is based on, and an item that
 * moved on since answers a version conflict.
 */
export function updateItem(
  itemId: string,
  version: number,
  change: UpdateItemBody,
): Promise<ArtifactItem> {
  return apiRequest(apiEndpoints.item.path({ itemId }), itemSchema, {
    action: 'save the item',
    method: HttpMethod.Patch,
    body: change,
    headers: { [HttpHeader.IfMatch]: String(version) },
  })
}

/** Deletes an item; its versions stay readable. A section that still holds items cannot be deleted. */
export function deleteItem(itemId: string): Promise<void> {
  return apiCommand(apiEndpoints.item.path({ itemId }), {
    action: 'delete the item',
    method: HttpMethod.Delete,
  })
}

/** Puts the children of one parent, or the top level when `parentItemId` is null, in a new order. */
export function reorderItems(
  artifactId: string,
  parentItemId: string | null,
  itemIds: string[],
): Promise<void> {
  return apiCommand(apiEndpoints.artifactItemsReorder.path({ artifactId }), {
    action: 'reorder the items',
    body: { parent_item_id: parentItemId, ids: itemIds },
  })
}

/** Moves an item, with everything inside it, under another parent of the same artifact. */
export function moveItem(itemId: string, move: MoveItemBody): Promise<ArtifactItem> {
  return apiRequest(apiEndpoints.itemMove.path({ itemId }), itemSchema, {
    action: 'move the item',
    method: HttpMethod.Post,
    body: move,
  })
}

/** Makes an old version of an item current again, as a new version. */
export function restoreItem(itemId: string, version: number): Promise<ArtifactItem> {
  return apiRequest(apiEndpoints.itemRestore.path({ itemId }), itemSchema, {
    action: 'restore the item',
    method: HttpMethod.Post,
    body: { version },
  })
}
