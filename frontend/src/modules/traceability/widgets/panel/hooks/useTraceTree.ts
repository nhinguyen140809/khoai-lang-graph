'use client'

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import { useMemo, useState } from 'react'

import { useOpenPage } from '@/shared/components/frame'

import { type TraceRow, traceTreeRootId } from '../trace-tree.types'

const rootId = traceTreeRootId

const emptyRow: TraceRow = {
  id: rootId,
  name: '',
  href: null,
  tone: null,
  reasons: null,
  children: [],
}

const treeIndent = 14

/**
 * The tree of the side panel of Trace over a flat record of rows: the folders start expanded, and
 * the tree keeps only the ones the user collapsed. A click opens the page of the row in the
 * preview tab, or in a tab of its own with `keep`.
 */
export function useTraceTree(nodes: Readonly<Record<string, TraceRow>>) {
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

  const tree = useTree<TraceRow>({
    rootItemId: rootId,
    indent: treeIndent,
    state: { expandedItems },
    setExpandedItems: (updater) => {
      const next = typeof updater === 'function' ? updater(expandedItems) : updater
      setCollapsed(folders.filter((id) => !next.includes(id)))
    },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().children.length > 0,
    dataLoader: {
      getItem: (id) => nodes[id] ?? nodes[rootId] ?? emptyRow,
      getChildren: (id) => nodes[id]?.children ?? [],
    },
    onPrimaryAction: (item) => {
      const row = item.getItemData()
      if (row.href !== null) openPage(row.href, { title: row.name })
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })

  return { tree, indent: treeIndent }
}
