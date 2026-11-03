import type { TraceLink } from '@/modules/trace/entities'

import { itemsWithDeleted } from '../../artifacts/artifacts.lookup'
import { traceLinkFixtures } from '../fixtures/trace-links.fixtures'
import { createdTraceLinks, deletedTraceLinkIds } from '../trace-links.store'

// The trace links as the mock server holds them now: the fixtures and the links made since, without
// the removed ones.

/** Every current link. */
export function allTraceLinks(): TraceLink[] {
  const deleted = new Set(deletedTraceLinkIds.get())
  return [...traceLinkFixtures, ...createdTraceLinks.get()].filter(({ id }) => !deleted.has(id))
}

export function findTraceLink(linkId: string): TraceLink | undefined {
  return allTraceLinks().find(({ id }) => id === linkId)
}

/**
 * The current links of a project: those that start at one of its items. A link to a deleted item
 * stays, since a deleted item stays readable.
 */
export function projectTraceLinks(projectId: string): TraceLink[] {
  const itemIds = new Set(
    itemsWithDeleted()
      .filter((item) => item.project_id === projectId)
      .map(({ id }) => id),
  )
  return allTraceLinks().filter(({ source_item_id }) => itemIds.has(source_item_id))
}
