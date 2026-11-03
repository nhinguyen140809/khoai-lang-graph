'use client'

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import { useEffect, useMemo, useState } from 'react'

import { useOpenPage } from '@/shared/components/frame'

import type { TreeNode } from '../document-tree.types'
import { treeRootId } from '../document-tree.utils'
import { plainLook } from '../row-look.utils'

const treeIndent = 14

/**
 * The tree instance of the panel over a flat record of rows, and the action that opens a row. The
 * folders start expanded; the tree keeps only the ones the user collapsed, so a row that appears
 * later, such as the outline of a document that loads, starts expanded too. `onRetry` answers a
 * click on the row that offers to load the outline again.
 */
export function useDocumentTree(nodes: Readonly<Record<string, TreeNode>>, onRetry: () => void) {
  const openPage = useOpenPage()
  const [collapsed, setCollapsed] = useState<string[]>([])
  const folders = useMemo(
    () => Object.values(nodes).flatMap(({ id, children }) => (children.length > 0 ? [id] : [])),
    [nodes],
  )
  const expandedItems = useMemo(
    () => folders.filter((id) => !collapsed.includes(id)),
    [folders, collapsed],
  )

  /** Opens the page of a row in the preview tab, or in a tab of its own with `keep`. */
  function open(id: string, { keep = false }: { keep?: boolean } = {}) {
    const node = nodes[id]
    const action = node?.action
    if (action?.type === 'retry') onRetry()
    else if (action?.type === 'open')
      openPage(action.href, { keep, ...(node !== undefined && { title: node.name }) })
  }

  const tree = useTree<TreeNode>({
    rootItemId: treeRootId,
    indent: treeIndent,
    state: { expandedItems },
    setExpandedItems: (updater) => {
      const next = typeof updater === 'function' ? updater(expandedItems) : updater
      setCollapsed(folders.filter((id) => !next.includes(id)))
    },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().children.length > 0,
    dataLoader: {
      getItem: (id) => nodes[id] ?? nodes[treeRootId] ?? emptyNode,
      getChildren: (id) => nodes[id]?.children ?? [],
    },
    onPrimaryAction: (item) => {
      open(item.getId())
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })

  useEffect(() => {
    tree.rebuildTree()
  }, [tree, nodes, expandedItems])

  return { tree, indent: treeIndent, open }
}

const emptyNode: TreeNode = {
  id: treeRootId,
  name: '',
  parentId: null,
  children: [],
  action: { type: 'none' },
  look: plainLook,
  collapsedLook: plainLook,
  count: null,
  location: [],
  icon: null,
}
