import type { Trace, TraceItem } from '../../chains/chains.types'
import type { TraceLink } from '../../links/trace-links.types'

// A small trace, its items and its links, for the tests of the graph of a chain.

/** An item of a trace, with the fields the graph reads. */
export function traceItem(
  id: string,
  key: string,
  kind: string,
  overrides: Partial<TraceItem> = {},
): TraceItem {
  return {
    id,
    artifact_id: `artifact-${id}`,
    key,
    kind,
    version: 1,
    review_status: 'approved',
    content: { title: `Title of ${key}` },
    ...overrides,
  }
}

/** A link of a trace, from the later item to the item it was built from. */
export function traceLink(
  id: string,
  source: string,
  target: string,
  linkType: string,
  overrides: Partial<TraceLink> = {},
): TraceLink {
  return {
    id,
    source_item_id: source,
    target_item_id: target,
    link_type: linkType,
    target_version: 1,
    target_quote: null,
    source_quote: null,
    note: null,
    ...overrides,
  }
}

/** A trace of the given items and links. */
export function traceWith({
  items = [],
  links = [],
}: {
  items?: TraceItem[]
  links?: TraceLink[]
} = {}): Trace {
  return { items, links }
}
