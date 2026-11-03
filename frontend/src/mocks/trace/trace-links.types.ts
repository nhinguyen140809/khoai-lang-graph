import type { ArtifactItem } from '@/modules/artifact/entities'
import type { ItemSummary, TraceLink } from '@/modules/trace/entities'
import type { LinkType } from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'

/** The link that the body of a request to make a link describes, before it has an id. */
export interface NewTraceLinkRecord {
  sourceItemId: string
  targetItemId: string
  linkType: string
  /** The version of the target now. */
  targetVersion: number
  note: string | null
}

/** A link as the fixtures write it: the keys of its two items, which the builder turns into ids. */
export interface LinkSpec {
  source: string
  target: string
  type: string
  /** The version of the target when the link was made; the current one when absent. */
  targetVersion?: number
  quote?: string
  note?: string
}

/** The items of a project and the links between them, read from either end of a link. */
export interface ProjectLinks {
  items: ArtifactItem[]
  itemById: Map<string, ArtifactItem>
  links: TraceLink[]
  /** The items that an item links to with a link type. */
  targetsOf: (item: ArtifactItem, linkType: string) => ArtifactItem[]
  /** The items that link to an item with a link type. */
  sourcesOf: (item: ArtifactItem, linkType: string) => ArtifactItem[]
}

/** A row of the matrix: the items of the chain in the cells of their columns. */
export type MatrixCells = Record<string, ItemSummary[]>

/** A kind of gap in the links of a project: what it is called, and how to find the items in it. */
export interface GapRule {
  key: string
  title: string
  description: string
  itemsIn: (project: ProjectLinks) => ArtifactItem[]
}

/** A link that a request asks for, with the project it is for, the items at its two ends and its type. */
export interface CandidateLink {
  /** The project the request is for. */
  projectId: string
  source: ArtifactItem
  target: ArtifactItem
  linkType: LinkType
}

/** One rule that a link between two items of a project must keep: the problem when it does not. */
export interface LinkRule {
  check: (candidate: CandidateLink) => FieldProblem | null
}
