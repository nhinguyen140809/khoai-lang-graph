import type { Trace, TraceItem } from '@/modules/trace/entities'

function item(id: string, version: number, status: TraceItem['review_status'] = 'approved') {
  return {
    id,
    artifact_id: 'art',
    key: id.toUpperCase(),
    kind: 'spec_requirement',
    version,
    review_status: status,
    content: { title: `Title of ${id}` },
  }
}

function link(
  id: string,
  source: string,
  target: string,
  targetVersion: number,
  targetQuote?: string,
) {
  return {
    id,
    source_item_id: source,
    target_item_id: target,
    link_type: 'derived_from',
    target_version: targetVersion,
    target_quote: targetQuote ?? null,
    source_quote: null,
    note: null,
  }
}

/** A trace, and the nodes and edges that its graph holds, by id. */
export const graphCases: {
  name: string
  trace: Trace
  nodes: { id: string; isSuperseded: boolean }[]
  edges: {
    id: string
    source: string
    target: string
    isOutOfDate: boolean
    targetQuote: string | null
  }[]
}[] = [
  {
    name: 'a node for each item and an edge for each link, from the source to the target',
    trace: { items: [item('a', 1), item('b', 1)], links: [link('l1', 'a', 'b', 1, 'the words')] },
    nodes: [
      { id: 'a', isSuperseded: false },
      { id: 'b', isSuperseded: false },
    ],
    edges: [{ id: 'l1', source: 'a', target: 'b', isOutOfDate: false, targetQuote: 'the words' }],
  },
  {
    name: 'an edge out of date when the target changed since, and a node superseded when replaced',
    trace: {
      items: [item('a', 1), item('b', 2, 'superseded'), item('c', 3)],
      links: [link('l1', 'a', 'b', 2), link('l2', 'a', 'c', 2)],
    },
    nodes: [
      { id: 'a', isSuperseded: false },
      { id: 'b', isSuperseded: true },
      { id: 'c', isSuperseded: false },
    ],
    edges: [
      { id: 'l1', source: 'a', target: 'b', isOutOfDate: true, targetQuote: null },
      { id: 'l2', source: 'a', target: 'c', isOutOfDate: true, targetQuote: null },
    ],
  },
  {
    name: 'a node for an item with no link, and no edge to an item that is not in the trace',
    trace: { items: [item('a', 1)], links: [link('l1', 'a', 'gone', 1)] },
    nodes: [{ id: 'a', isSuperseded: false }],
    edges: [],
  },
]

/** A trace with two items, to read the titles of its nodes. */
export const twoItemTrace: Trace = { items: [item('a', 1), item('b', 1)], links: [] }
