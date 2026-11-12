'use client'

import { hotkeysCoreFeature, selectionFeature, syncDataLoaderFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'

import { Tree, TreeItem, TreeItemLabel } from '@/shared/components/ui/tree'
import { useLeavingRows } from '@/shared/lib/animation'

import { type ExplorerNode, explorerNodes } from '../design-system.fixtures'

const INDENT = 16

function getNode(id: string): ExplorerNode {
  return explorerNodes[id] ?? { name: id }
}

/**
 * The artifact tree of the example project, with REQ-001 open and selected. Arrow keys move,
 * Enter selects; the Tree component indents the levels and marks the selection.
 */
export function ArtifactTree({ className }: { className?: string }) {
  const tree = useTree<ExplorerNode>({
    rootItemId: 'root',
    indent: INDENT,
    initialState: {
      expandedItems: ['personas', 'spec', 'sec-3', 'sec-3-1'],
      selectedItems: ['req-1'],
    },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: getNode,
      getChildren: (id) => getNode(id).children ?? [],
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
  })

  const treeRows = useLeavingRows(tree.getItems(), (item) => item.getId())

  return (
    <Tree indent={INDENT} tree={tree} guides aria-label="Artifacts" className={className}>
      {treeRows.map(({ row: item, isLeaving }) => (
        <TreeItem key={item.getId()} item={item} isLeaving={isLeaving}>
          <TreeItemLabel />
        </TreeItem>
      ))}
    </Tree>
  )
}
