import { describe, expect, it } from 'vitest'

import type { ChainContext, ItemAttention } from '../trace-graph.types'
import { chainGraphOf } from '../trace-graph.utils'
import { traceItem, traceLink, traceWith } from './trace-graph.utils.data'

const kindTitles: Record<string, string> = {
  spec_requirement: 'Requirement',
  analyzed_requirement: 'Analysed requirement',
  ambiguity_issue: 'Point to clarify',
}

const linkTitles: Record<string, string> = {
  derived_from: 'Based on',
  concerns: 'Applies to',
}

const noAttention: ItemAttention = { level: 'none', reasons: [] }

/** A context that names the words of the trace and gives no attention. */
function contextOf(focusId: string): ChainContext {
  return {
    focusId,
    issueKinds: [{ kind: 'ambiguity_issue', statusField: 'status', openValues: ['open'] }],
    titleOf: (item) => `Title of ${item.key}`,
    kindTitleOf: (item) => kindTitles[item.kind] ?? item.kind,
    linkTitleOf: (linkType) => linkTitles[linkType] ?? linkType,
    attentionOf: () => noAttention,
  }
}

const requirement = traceItem('req', 'REQ-003', 'spec_requirement')
const analysis = traceItem('ar', 'AR-003', 'analyzed_requirement', { version: 3 })
const openIssue = traceItem('issue', 'AMB-001', 'ambiguity_issue', {
  content: { title: 'Fast has no number', status: 'open' },
})

const trace = traceWith({
  items: [requirement, analysis, openIssue],
  links: [
    traceLink('l1', 'req', 'ar', 'derived_from', {
      target_version: 1,
      source_quote: 'the booking in layers',
    }),
    traceLink('l2', 'issue', 'req', 'concerns', { target_quote: 'within 2 seconds' }),
    // A link to an item that the trace does not hold has no edge.
    traceLink('l3', 'req', 'gone', 'derived_from'),
  ],
})

describe('chainGraphOf', () => {
  it('names each node by the kind and the title of its item, and marks the node of the item itself', () => {
    const graph = chainGraphOf(trace, contextOf('req'))

    expect(
      graph.nodes.map(({ kindTitle, title, isFocus }) => ({ kindTitle, title, isFocus })),
    ).toEqual([
      { kindTitle: 'Requirement', title: 'Title of REQ-003', isFocus: true },
      { kindTitle: 'Analysed requirement', title: 'Title of AR-003', isFocus: false },
      { kindTitle: 'Point to clarify', title: 'Title of AMB-001', isFocus: false },
    ])
    expect(graph.nodes.map(({ key, reviewStatus }) => ({ key, reviewStatus }))).toEqual([
      { key: 'REQ-003', reviewStatus: 'approved' },
      { key: 'AR-003', reviewStatus: 'approved' },
      { key: 'AMB-001', reviewStatus: 'approved' },
    ])
  })

  it('carries the title of its link on each edge, with the words it quotes on their own side', () => {
    const graph = chainGraphOf(trace, contextOf('req'))
    const [basedOn, appliesTo] = graph.edges

    expect(basedOn).toMatchObject({
      id: 'l1',
      source: 'req',
      target: 'ar',
      linkType: 'derived_from',
      linkTitle: 'Based on',
      sourceQuote: 'the booking in layers',
      targetQuote: null,
    })
    expect(appliesTo).toMatchObject({
      id: 'l2',
      linkTitle: 'Applies to',
      sourceQuote: null,
      targetQuote: 'within 2 seconds',
    })
  })

  it('leaves a link out whose end is not among the items of the trace', () => {
    const graph = chainGraphOf(trace, contextOf('req'))

    expect(graph.edges.map(({ id }) => id)).toEqual(['l1', 'l2'])
  })

  it('gives each edge the attention of its link, and the version it was made from when it is out of date', () => {
    const graph = chainGraphOf(trace, contextOf('req'))
    const [basedOn, appliesTo] = graph.edges

    // The analysis changed (version 3) after the link was made from version 1.
    expect(basedOn?.attention).toBe('act')
    expect(basedOn?.madeFromVersion).toBe(1)
    // A link that comes from an open issue asks the user to follow it.
    expect(appliesTo?.attention).toBe('follow')
    expect(appliesTo?.madeFromVersion).toBeNull()
  })

  it('takes the attention of each node from the attention it is given', () => {
    const attention: ItemAttention = { level: 'act', reasons: ['The links need a new look.'] }
    const graph = chainGraphOf(trace, {
      ...contextOf('req'),
      attentionOf: (item) => (item.id === 'req' ? attention : noAttention),
    })

    expect(graph.nodes[0]?.attention).toEqual(attention)
    expect(graph.nodes[1]?.attention).toEqual(noAttention)
  })
})
