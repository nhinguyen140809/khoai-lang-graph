import type { AttentionLevel, ReviewStatus } from '@/modules/artifact/entities'
import type { ChainEdgeData, ChainNodeData } from '@/modules/trace/entities'
import type { NodeVariant } from '@/shared/components/ui/node'
import type { Tone } from '@/shared/lib/tone'

interface NodeLookCase {
  status: ReviewStatus
  attention: AttentionLevel
  variant: NodeVariant
  color: Tone
  isFaded: boolean
}

const statuses: ReviewStatus[] = ['draft', 'approved', 'rejected', 'superseded']

// Every review status at every level of attention: sixteen looks of a node of the chain. What an
// item asks of the user decides first, so a level that asks something paints every status alike;
// an item that was rejected or replaced is set aside whenever it asks nothing; and only an item
// that asks nothing and is not set aside is painted by its review status.
export const nodeLookCases: NodeLookCase[] = [
  ...statuses.map((status): NodeLookCase => ({
    status,
    attention: 'act',
    variant: 'soft',
    color: 'warning',
    isFaded: false,
  })),
  ...statuses.map((status): NodeLookCase => ({
    status,
    attention: 'follow',
    variant: 'soft',
    color: 'primary',
    isFaded: false,
  })),
  ...statuses.map((status): NodeLookCase => ({
    status,
    attention: 'quiet',
    variant: 'soft',
    color: 'muted',
    isFaded: true,
  })),
  { status: 'draft', attention: 'none', variant: 'outline', color: 'neutral', isFaded: false },
  { status: 'approved', attention: 'none', variant: 'solid', color: 'primary', isFaded: false },
  { status: 'rejected', attention: 'none', variant: 'soft', color: 'muted', isFaded: true },
  { status: 'superseded', attention: 'none', variant: 'soft', color: 'muted', isFaded: true },
]

/** A node of a chain, from its id, the title of its kind and its place in the layout. */
export function chainNodeOf(id: string, kindTitle = 'Requirement'): ChainNodeData {
  return {
    id,
    artifactId: 'artifact-1',
    kind: 'requirement',
    kindTitle,
    title: `Title of ${id}`,
    key: id.toUpperCase(),
    content: {},
    reviewStatus: 'draft',
    attention: { level: 'none', reasons: [] },
    isFocus: false,
  }
}

/** An edge of a chain, from the node that it leaves to the node that it reaches. */
export function chainEdgeOf(id: string, source: string, target: string): ChainEdgeData {
  return {
    id,
    source,
    target,
    sourceArtifactId: 'artifact-1',
    linkType: 'derived_from',
    linkTitle: 'Derived from',
    attention: 'none',
    sourceQuote: null,
    targetQuote: null,
    madeFromVersion: null,
  }
}
