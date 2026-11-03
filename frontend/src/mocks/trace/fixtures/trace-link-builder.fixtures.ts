import type { ArtifactItem } from '@/modules/artifact/entities'
import type { TraceLink } from '@/modules/trace/entities'

import { IdPrefix, mockId } from '../../shared/db'
import type { LinkSpec } from '../trace-links.types'

/**
 * Turns link specs into the links that the API serves. `n` makes the ids of this project differ
 * from the ids of the others; a spec that names a key the items do not hold is left out.
 */
export function buildTraceLinks(specs: LinkSpec[], items: ArtifactItem[], n: number): TraceLink[] {
  const byKey = new Map(items.map((item) => [item.key, item]))
  return specs.flatMap((spec, index) => {
    const source = byKey.get(spec.source)
    const target = byKey.get(spec.target)
    if (source === undefined || target === undefined) return []
    return [
      {
        id: mockId(IdPrefix.TraceLink, n * 1000 + index + 1),
        source_item_id: source.id,
        target_item_id: target.id,
        link_type: spec.type,
        target_version: spec.targetVersion ?? target.version,
        target_quote: spec.targetQuote ?? null,
        source_quote: spec.sourceQuote ?? null,
        note: spec.note ?? null,
      },
    ]
  })
}
