import type { TraceLink } from '../../links/trace-links.types'
import type { Trace, TraceItem } from '../chains.types'

/** An item of a trace, with the least it holds. */
function item(id: string, key: string, kind: string, version = 1): TraceItem {
  return {
    id,
    artifact_id: `artifact-${id}`,
    key,
    kind,
    version,
    review_status: 'approved',
    content: {},
  }
}

/** A link with the least it holds. */
function link(
  id: string,
  source: string,
  target: string,
  linkType: string,
  targetVersion = 1,
): TraceLink {
  return {
    id,
    source_item_id: source,
    target_item_id: target,
    link_type: linkType,
    target_version: targetVersion,
    target_quote: null,
    source_quote: null,
    note: null,
  }
}

/** The chain of a requirement down to a message, with two paths to one raw requirement. */
export const chainTrace: Trace = {
  items: [
    item('spec', 'REQ-001', 'spec_requirement'),
    item('analyzed', 'AR-001', 'analyzed_requirement'),
    item('analyzed2', 'AR-002', 'analyzed_requirement'),
    item('raw', 'RAW-001', 'raw_requirement'),
    item('message', 'PER-001#2', 'interview_message'),
  ],
  links: [
    link('l1', 'spec', 'analyzed', 'derived_from'),
    link('l2', 'analyzed', 'raw', 'derived_from'),
    link('l3', 'analyzed2', 'raw', 'derived_from'),
    link('l4', 'raw', 'message', 'evidenced_by'),
    link('l5', 'spec', 'analyzed', 'concerns'),
  ],
}

/** A loop: the analyzed requirement is based on itself through the raw one. */

/** The quotes of the items of a trace, by item. */
export const quotesTrace: Trace = {
  items: [
    item('spec', 'REQ-001', 'spec_requirement'),
    item('analyzed', 'AR-001', 'analyzed_requirement'),
    item('message', 'PER-001#2', 'interview_message'),
  ],
  links: [
    {
      ...link('l1', 'spec', 'analyzed', 'derived_from'),
      source_quote: 'search mentors',
      target_quote: 'lists mentors',
    },
    {
      ...link('l2', 'analyzed', 'message', 'evidenced_by'),
      target_quote: 'I ask seniors',
    },
  ],
}

/** One link is out of date: its target moved on; the source of it is the out of date item. */
export const outOfDateTrace: Trace = {
  items: [
    item('spec', 'REQ-003', 'spec_requirement'),
    item('analyzed', 'AR-007', 'analyzed_requirement', 2),
    item('other', 'REQ-004', 'spec_requirement'),
    { ...item('gone', 'AR-008', 'analyzed_requirement'), review_status: 'superseded' as const },
  ],
  links: [
    link('l1', 'spec', 'analyzed', 'derived_from', 1),
    link('l2', 'other', 'gone', 'derived_from'),
    link('l3', 'other', 'analyzed', 'derived_from', 2),
  ],
}
