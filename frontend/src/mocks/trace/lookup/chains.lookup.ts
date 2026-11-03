import type { ArtifactItem } from '@/modules/artifact/entities'
import type { Trace, TraceDirection, TraceItem, TraceLink } from '@/modules/trace/entities'
import { distancesFrom, successorsFrom } from '@/shared/lib/graph'

import { itemsWithDeleted } from '../../artifacts/artifacts.lookup'
import { allTraceLinks } from './trace-links.lookup'

// The chains of the trace links, followed from some items.

/** One way to follow a link: from the item at one end of it to the item at the other end. */
interface LinkWay {
  leavesFrom: (link: TraceLink) => string
  leadsTo: (link: TraceLink) => string
}

// A link points from the later item to the earlier one: going backward follows it, going forward
// goes against it.
const backward: LinkWay = {
  leavesFrom: (link) => link.source_item_id,
  leadsTo: (link) => link.target_item_id,
}
const forward: LinkWay = {
  leavesFrom: (link) => link.target_item_id,
  leadsTo: (link) => link.source_item_id,
}
const waysOf: Record<TraceDirection, LinkWay[]> = {
  backward: [backward],
  forward: [forward],
  both: [backward, forward],
}

// The items and the links that following the links one way from the start items reaches, to
// `depth` links away, or as far as the links lead when `depth` is null.
function followWay(startIds: readonly string[], way: LinkWay, depth: number | null) {
  const links = allTraceLinks()
  const distances = distancesFrom(
    startIds,
    successorsFrom(links, way.leavesFrom, way.leadsTo),
    depth,
  )
  const followedLinks = links.filter((link) => {
    const distance = distances.get(way.leavesFrom(link))
    return distance !== undefined && (depth === null || distance < depth)
  })
  return { itemIds: [...distances.keys()], links: followedLinks }
}

function toTraceItem(item: ArtifactItem): TraceItem {
  const { id, artifact_id, key, kind, version, review_status, content } = item
  return { id, artifact_id, key, kind, version, review_status, content }
}

/**
 * The items that a trace from `startIds` reaches, with the start items, and the links it follows;
 * the items are in key order and the links in id order. `depth` is how many links away it goes, or
 * null for no limit.
 */
export function traceFrom(
  startIds: readonly string[],
  direction: TraceDirection,
  depth: number | null,
): Trace {
  const followed = waysOf[direction].map((way) => followWay(startIds, way, depth))
  const itemIds = new Set(followed.flatMap((one) => one.itemIds))
  const linksById = new Map(
    followed.flatMap((one) => one.links.map((link) => [link.id, link] as const)),
  )
  return {
    items: itemsWithDeleted()
      .filter(({ id }) => itemIds.has(id))
      .map(toTraceItem)
      .toSorted((a, b) => a.key.localeCompare(b.key)),
    links: [...linksById.values()].toSorted((a, b) => a.id.localeCompare(b.id)),
  }
}
