import type { MatrixItem, TraceLink } from './traceability.types'

/** The kinds a chain can end at: a raw requirement or a latent need. */
const CHAIN_ENDS = ['raw_requirement', 'latent_need'] as const

/** An evidence link: from a raw source item to the interview message behind it. */
const EVIDENCE = 'evidenced_by' as const

export interface MatrixRow {
  /** The chain head, a backlog item; `null` when nothing upstream covers the row head. */
  backlog: MatrixItem | null
  spec: MatrixItem | null
  analyzed: MatrixItem | null
  /** The raw requirement or latent need at the head of the chain. */
  source: MatrixItem | null
  /** The interview message the source cites, if it cites one. */
  evidence: MatrixItem | null
}

export interface TraceabilityMatrix {
  rows: MatrixRow[]
  /** One gap count per chain column: items of that kind with nothing upstream. */
  gaps: Record<'backlog' | 'spec' | 'analyzed' | 'source', number>
  /** The open issue items: ambiguity issues, conflicts and validation issues. */
  issues: MatrixItem[]
}

function derivedMap(links: TraceLink[]) {
  const bySource = new Map<string, TraceLink[]>()
  for (const link of links) {
    if (link.link_type !== 'derived_from') continue
    const group = bySource.get(link.source.id)
    if (group) group.push(link)
    else bySource.set(link.source.id, [link])
  }
  return bySource
}

function derivedTarget(items: Map<string, MatrixItem>, links: TraceLink[], id: string) {
  for (const link of links) {
    if (link.source.id !== id || link.link_type !== 'derived_from') continue
    const target = items.get(link.target.id)
    if (target) return target
  }
  return null
}

/**
 * The coverage matrix: one row per `derived_from` chain from a backlog item
 * down to its raw or latent source, with the interview evidence behind it.
 * Rows without a head stand for spec chains that no backlog item grew from.
 */
export function buildMatrix(links: TraceLink[], items: MatrixItem[]): TraceabilityMatrix {
  const byId = new Map(items.map((item) => [item.id, item]))
  const derived = derivedMap(links)
  const rows: MatrixRow[] = []
  const reachedSpecs = new Set<string>()
  const reachedAnalyzed = new Set<string>()
  const reachedSources = new Set<string>()

  const evidenceOf = (sourceId: string): MatrixItem | null => {
    for (const link of links) {
      if (link.source.id === sourceId && link.link_type === EVIDENCE) {
        const message = byId.get(link.target.id)
        if (message) return message
      }
    }
    return null
  }

  for (const item of items) {
    if (item.kind !== 'backlog_item') continue
    const spec = derivedTarget(byId, links, item.id)
    const analyzed = spec ? derivedTarget(byId, links, spec.id) : null
    const source = analyzed ? derivedTarget(byId, links, analyzed.id) : null
    if (spec) reachedSpecs.add(spec.id)
    if (analyzed) reachedAnalyzed.add(analyzed.id)
    if (source) {
      reachedSources.add(source.id)
      rows.push({ backlog: item, spec, analyzed, source, evidence: evidenceOf(source.id) })
    } else {
      rows.push({ backlog: item, spec, analyzed, source: null, evidence: null })
    }
  }
  for (const item of items) {
    if (item.kind === 'spec_requirement' && !reachedSpecs.has(item.id)) {
      const analyzed = derivedTarget(byId, links, item.id)
      const source = analyzed ? derivedTarget(byId, links, analyzed.id) : null
      if (source) {
        reachedSources.add(source.id)
        rows.push({ backlog: null, spec: item, analyzed, source, evidence: evidenceOf(source.id) })
      } else {
        rows.push({ backlog: null, spec: item, analyzed, source: null, evidence: null })
      }
    }
  }

  const gaps = {
    backlog: items.filter((item) => item.kind === 'backlog_item' && !derived.has(item.id)).length,
    spec: items.filter((item) => item.kind === 'spec_requirement' && !reachedSpecs.has(item.id))
      .length,
    analyzed: items.filter(
      (item) => item.kind === 'analyzed_requirement' && !reachedAnalyzed.has(item.id),
    ).length,
    source: items.filter(
      (item) =>
        (CHAIN_ENDS as readonly string[]).includes(item.kind) && !reachedSources.has(item.id),
    ).length,
  }
  const issues = items.filter(
    (item) =>
      item.kind === 'ambiguity_issue' ||
      item.kind === 'conflict' ||
      (item.kind === 'validation_issue' && item.review_status === 'open'),
  )
  return { rows, gaps, issues }
}
