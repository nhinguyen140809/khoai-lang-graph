import type { ArtifactItem } from '@/modules/artifact/entities'
import type { ItemSummary, TraceLink } from '@/modules/trace/entities'
import { contentSchemasByKind, itemTitle } from '@/modules/workflow/entities'

import { allItems } from '../../artifacts/artifacts.lookup'
import { artifactKindFixtures } from '../../workflow/artifact-kinds.fixtures'
import type { ProjectLinks } from '../trace-links.types'
import { projectTraceLinks } from './trace-links.lookup'

// The items and the links of one project, as the views of its traceability read them.

const contentSchemas = contentSchemasByKind(artifactKindFixtures)

/** The items of a project and the links between them. */
export function itemsAndLinksOf(projectId: string): ProjectLinks {
  const items = allItems().filter((item) => item.project_id === projectId)
  const itemById = new Map(items.map((item) => [item.id, item]))
  const links = projectTraceLinks(projectId).filter(({ target_item_id }) =>
    itemById.has(target_item_id),
  )
  // The items at the far end of the links of a type that leave an item from one end.
  const linkedItems = (
    item: ArtifactItem,
    linkType: string,
    nearEnd: (link: TraceLink) => string,
    farEnd: (link: TraceLink) => string,
  ) =>
    links
      .filter((link) => nearEnd(link) === item.id && link.link_type === linkType)
      .flatMap((link) => itemById.get(farEnd(link)) ?? [])
  return {
    items,
    itemById,
    links,
    targetsOf: (item, linkType) =>
      linkedItems(
        item,
        linkType,
        (link) => link.source_item_id,
        (link) => link.target_item_id,
      ),
    sourcesOf: (item, linkType) =>
      linkedItems(
        item,
        linkType,
        (link) => link.target_item_id,
        (link) => link.source_item_id,
      ),
  }
}

/** An item as a cell or a list of the traceability views shows it. */
export function toSummary(item: ArtifactItem): ItemSummary {
  return {
    item_id: item.id,
    key: item.key,
    kind: item.kind,
    title: itemTitle(contentSchemas.get(item.kind), item),
  }
}

/** The items without a repeat of an item, in the order they first appear. */
export function distinctById(items: ArtifactItem[]): ArtifactItem[] {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}
