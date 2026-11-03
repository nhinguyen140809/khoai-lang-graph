import type { Route } from 'next'

import { type Artifact, isBranch, type OutlineNode } from '@/modules/artifact/entities'
import {
  type DocumentEntry,
  type DocumentMark,
  documentTabIconName,
} from '@/modules/documents/entities'
import type { ContentDisplay } from '@/modules/workflow/entities'
import type { View } from '@/shared/lib/view'

import type { RowLook, TreeAction, TreeNode } from './document-tree.types'
import { branchRowLooks, itemRowLook, markRowLook, messageLook, plainLook } from './row-look.utils'

/** The id of the row of a document. */
export function documentNodeId(artifactId: string): string {
  return `doc:${artifactId}`
}

/** The id of the root of the tree, which no row draws. */
export const treeRootId = 'root'

interface OpenOutline {
  artifactId: string
  /** The rows of the outline, or the message to show in their place. */
  nodes: readonly OutlineNode[] | { message: string; isRetry: boolean }
  isUnderReview: boolean
}

interface TreeInput {
  entries: readonly DocumentEntry[]
  openOutline: OpenOutline | null
  hrefs: { document: (artifactId: string) => Route; item: (itemId: string) => Route }
  /** The view of the app, which words the status of an item. */
  view: View
  /** What each kind of document is made of, which gives the icon of its row. */
  displays: ReadonlyMap<string, ContentDisplay>
}

type Nodes = Record<string, Omit<TreeNode, 'location'>>

const noAction: TreeAction = { type: 'none' }

function openAction(href: Route | null): TreeAction {
  return href === null ? noAction : { type: 'open', href }
}

function leaf(
  id: string,
  name: string,
  parentId: string,
  fields: { action: TreeAction; look: RowLook },
): Nodes[string] {
  return {
    id,
    name,
    parentId,
    children: [],
    collapsedLook: fields.look,
    count: null,
    icon: null,
    ...fields,
  }
}

function outlineHref(node: OutlineNode, openArtifactId: string, input: TreeInput): Route | null {
  switch (node.type) {
    case 'item':
      return input.hrefs.item(node.item.id)
    case 'field':
      return input.hrefs.document(openArtifactId)
    case 'section':
    case 'group':
      return null
  }
}

function addOutlineNodes(
  nodes: Nodes,
  outline: readonly OutlineNode[],
  parentId: string,
  input: TreeInput,
  open: OpenOutline,
): string[] {
  const children: string[] = []
  for (const node of outline) {
    children.push(node.id)
    const action = openAction(outlineHref(node, open.artifactId, input))
    const options = { isUnderReview: open.isUnderReview }
    if (isBranch(node)) {
      const looks = branchRowLooks(node.statusCounts, options)
      nodes[node.id] = {
        id: node.id,
        name: node.title,
        parentId,
        children: node.children.map(({ id }) => id),
        action,
        look: looks.expanded,
        collapsedLook: looks.collapsed,
        count: node.count,
        icon: null,
      }
      addOutlineNodes(nodes, node.children, node.id, input, open)
    } else {
      const look =
        node.type === 'item'
          ? itemRowLook(node.status, node.item.version, options, input.view)
          : plainLook
      nodes[node.id] = leaf(node.id, node.title, parentId, { action, look })
    }
  }
  return children
}

function outlineChildren(
  nodes: Nodes,
  documentId: string,
  open: OpenOutline,
  input: TreeInput,
): string[] {
  if ('message' in open.nodes) {
    const id = `message:${documentId}`
    nodes[id] = leaf(id, open.nodes.message, documentId, {
      action: open.nodes.isRetry ? { type: 'retry' } : noAction,
      look: messageLook,
    })
    return [id]
  }
  return addOutlineNodes(nodes, open.nodes, documentId, input, open)
}

/** Adds the row of a document, with the outline under it when it is the open one; gives its id. */
function addDocumentNode(
  nodes: Nodes,
  document: {
    artifact: Artifact | null
    kind: string
    title: string
    mark: DocumentMark
    parentId: string
  },
  input: TreeInput,
): string {
  const { artifact, kind, title, mark, parentId } = document
  const id = artifact === null ? `kind:${kind}` : documentNodeId(artifact.id)
  const open =
    artifact !== null && artifact.id === input.openOutline?.artifactId ? input.openOutline : null
  const node = leaf(id, title, parentId, {
    action: openAction(artifact === null ? null : input.hrefs.document(artifact.id)),
    look: markRowLook(mark, artifact?.version ?? null),
  })
  node.icon = documentTabIconName(input.displays.get(kind), { isUnderReview: false })
  nodes[id] = node
  if (open !== null) node.children.push(...outlineChildren(nodes, id, open, input))
  return id
}

/** Adds the row of a group with its documents and the subjects that have none, and gives its id. */
function addGroupNode(
  nodes: Nodes,
  entry: Extract<DocumentEntry, { type: 'group' }>,
  input: TreeInput,
): string {
  const id = `kind:${entry.kind}`
  const children = entry.documents.map(({ artifact, mark }) =>
    addDocumentNode(
      nodes,
      { artifact, kind: entry.kind, title: artifact.title, mark, parentId: id },
      input,
    ),
  )
  for (const subject of entry.notStarted) {
    const subjectId = `subject:${subject.id}`
    nodes[subjectId] = leaf(subjectId, subject.title, id, {
      action: noAction,
      look: markRowLook('notStarted', null),
    })
    children.push(subjectId)
  }
  const look = markRowLook(entry.mark, null)
  nodes[id] = {
    ...leaf(id, entry.title, treeRootId, { action: noAction, look }),
    children,
    count: entry.documents.length,
  }
  return id
}

/** The titles above a row, from the top down to its parent. */
function rowLocation(
  nodes: Readonly<Record<string, { name: string; parentId: string | null }>>,
  id: string,
) {
  const titles: string[] = []
  let parentId = nodes[id]?.parentId ?? null
  while (parentId !== null && parentId !== treeRootId) {
    const parent = nodes[parentId]
    if (parent === undefined) break
    titles.unshift(parent.name)
    parentId = parent.parentId
  }
  return titles
}

/**
 * The flat record of rows that the tree reads: the documents and the groups at the top, and under
 * the row of the open document the rows of its outline. Each row holds all that is needed to draw
 * it: its looks, its count, its place and what a click on it does.
 */
export function documentTreeNodes(input: TreeInput): Record<string, TreeNode> {
  const nodes: Nodes = {}
  const top = input.entries.map((entry) =>
    entry.type === 'document'
      ? addDocumentNode(nodes, { ...entry, parentId: treeRootId }, input)
      : addGroupNode(nodes, entry, input),
  )
  nodes[treeRootId] = {
    ...leaf(treeRootId, '', treeRootId, { action: noAction, look: plainLook }),
    parentId: null,
    children: top,
  }
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, { ...node, location: rowLocation(nodes, id) }]),
  )
}
