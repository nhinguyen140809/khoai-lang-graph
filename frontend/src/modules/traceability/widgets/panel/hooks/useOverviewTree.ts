'use client'

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'

import { useOpenPage } from '@/shared/components/frame'

import { overviewRootId, type OverviewRow } from '../overview.types'

const emptyRow: OverviewRow = {
  id: overviewRootId,
  name: '',
  href: null,
  count: null,
  tone: 'neutral',
  description: null,
  children: [],
}

/**
 * The flat tree of the overview of the panel: one level of rows, each of which opens its page in
 * the preview tab, with the hover, the selection and the arrow keys of the trees of the panel.
 */
export function useOverviewTree(nodes: Readonly<Record<string, OverviewRow>>) {
  const openPage = useOpenPage()
  return useTree<OverviewRow>({
    rootItemId: overviewRootId,
    indent: 0,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().children.length > 0,
    dataLoader: {
      getItem: (id) => nodes[id] ?? emptyRow,
      getChildren: (id) => nodes[id]?.children ?? [],
    },
    onPrimaryAction: (item) => {
      const row = item.getItemData()
      if (row.href !== null) openPage(row.href)
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })
}
