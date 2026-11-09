import {
  type Artifact,
  type ArtifactItem,
  artifactOutline,
  attentionLevels,
  type KindView,
  type OutlineItem,
  outlineItemsOf,
  type OutlineNode,
} from '@/modules/artifact/entities'
import type { ItemAttention } from '@/modules/trace/entities'
import type { IssueKind } from '@/modules/workflow/entities'
import type { Tone } from '@/shared/lib/tone'

import {
  type DocumentOutlineInput,
  type TraceRow,
  type TraceRows,
  type TraceRowsInput,
  traceTreeRootId,
} from './trace-tree.types'

/** The tone of the title of a row, by how much it asks of the user; null keeps the plain color. */
function toneOf(level: ItemAttention['level'] | undefined): Tone | null {
  if (level === undefined || level === 'none') return null
  const tone = attentionLevels[level].color
  return tone
}

/**
 * The outline of every document of the project, by artifact id, drawn from the items that the
 * panel already reads for the attention: the tree shows every document without a read of its own.
 * The items of each document keep the order of the read within their run, and the superseded
 * never show; the nesting of the sections and the order of the runs come from the arrangement
 * itself. `kinds` draws every kind of item, so the sections and the runs read their titles and
 * their display from it.
 */
export function outlineNodesOf({
  documents,
  items,
  kinds,
  issueKinds,
}: {
  documents: readonly DocumentOutlineInput[]
  items: readonly ArtifactItem[]
  kinds: ReadonlyMap<string, KindView>
  issueKinds: readonly IssueKind[]
}): ReadonlyMap<string, readonly OutlineNode[]> {
  const itemsByArtifact = new Map<string, ArtifactItem[]>()
  for (const item of items) {
    const ofArtifact = itemsByArtifact.get(item.artifact_id) ?? []
    ofArtifact.push(item)
    itemsByArtifact.set(item.artifact_id, ofArtifact)
  }
  const outlines = new Map<string, readonly OutlineNode[]>()
  for (const { artifact, itemKinds } of documents) {
    outlines.set(
      artifact.id,
      artifactOutline({
        artifact,
        artifactSchema: kinds.get(artifact.kind)?.schema,
        issueKinds,
        items: outlineItemsOf(itemsByArtifact.get(artifact.id) ?? []),
        kinds,
        itemKinds,
      }),
    )
  }
  return outlines
}

/** Builds the rows of the tree: every document of the project with the items of it, the title of
 * each row in the color of how much it asks of the user. */
export function traceRows({ entries, outlines, attention, itemTrace }: TraceRowsInput): TraceRows {
  const rows: Record<string, TraceRow> = {}
  const rowOfItem = new Map<string, string>()
  const rootChildren: string[] = []
  const attentionOf =
    attention.state === 'success'
      ? (item: OutlineItem): ItemAttention => attention.attentionOf(item)
      : undefined
  const attentionByArtifact =
    attention.state === 'success' ? attention.attentionByArtifact : undefined

  const outlineChildren = (prefix: string, nodes: readonly OutlineNode[]): string[] =>
    nodes.flatMap((node) => {
      const id = `${prefix}:${node.id}`
      if (node.type === 'item') {
        const level = attentionOf?.(node.item)
        rows[id] = {
          id,
          name: node.title,
          href: itemTrace(node.item.id),
          tone: toneOf(level?.level),
          reasons: level === undefined ? null : level.reasons,
          children: [],
        }
        rowOfItem.set(node.item.id, id)
        return [id]
      }
      rows[id] = {
        ...labelRow(id, node.title),
        children: node.type === 'field' ? [] : outlineChildren(id, node.children),
      }
      return [id]
    })

  for (const entry of entries) {
    if (entry.type === 'document') {
      if (entry.artifact !== null) {
        rootChildren.push(
          documentRow({
            artifact: entry.artifact,
            title: entry.title,
            outlines,
            attentionByArtifact,
            outlineChildren,
            rows,
          }),
        )
      } else {
        const id = `not-started:${entry.kind}`
        rows[id] = labelRow(id, entry.title)
        rootChildren.push(id)
      }
      continue
    }

    const groupId = `group:${entry.kind}`
    const groupChildren = entry.documents.map((document) =>
      documentRow({
        artifact: document.artifact,
        title: document.artifact.title,
        outlines,
        attentionByArtifact,
        outlineChildren,
        rows,
      }),
    )
    for (const subject of entry.notStarted) {
      const id = `not-started:${subject.id}`
      rows[id] = labelRow(id, subject.title)
      groupChildren.push(id)
    }
    rows[groupId] = { ...labelRow(groupId, entry.title), children: groupChildren }
    rootChildren.push(groupId)
  }

  rows[traceTreeRootId] = { ...labelRow(traceTreeRootId, ''), children: rootChildren }
  return { rows, rowOfItem }
}

/** A plain row that opens nothing: a document that has not started, a subject without its artifact. */
function labelRow(id: string, name: string): TraceRow {
  return {
    id,
    name,
    href: null,
    tone: null,
    reasons: null,
    children: [],
  }
}

/** What the row of one document reads: the document, its title, and what every row of the tree shares. */
interface DocumentRowInput {
  artifact: Artifact
  title: string
  outlines: ReadonlyMap<string, readonly OutlineNode[]>
  attentionByArtifact: ReadonlyMap<string, ItemAttention> | undefined
  outlineChildren: (prefix: string, nodes: readonly OutlineNode[]) => string[]
  rows: Record<string, TraceRow>
}

/** The row of one document, colored by how much its items ask of the user, with its items under it. */
function documentRow({
  artifact,
  title,
  outlines,
  attentionByArtifact,
  outlineChildren,
  rows,
}: DocumentRowInput): string {
  const id = `document:${artifact.id}`
  const attention = attentionByArtifact?.get(artifact.id)
  rows[id] = {
    id,
    name: title,
    href: null,
    tone: toneOf(attention?.level),
    reasons: attention === undefined ? null : attention.reasons,
    children: outlineChildren(id, outlines.get(artifact.id) ?? []),
  }
  return id
}
