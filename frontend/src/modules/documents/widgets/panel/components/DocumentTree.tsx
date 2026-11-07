'use client'

import type { ItemInstance } from '@headless-tree/core'
import { cn } from 'cn'

import { documentsMessages } from '@/modules/documents/entities'
import { useTabIcon } from '@/shared/components/frame'
import { ColoredText } from '@/shared/components/ui/colored-text'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Tree, TreeItem, TreeItemLabel } from '@/shared/components/ui/tree'
import { useScrollIntoView } from '@/shared/lib/viewport'

import type { RowLook, TreeNode } from '../document-tree.types'
import { useDocumentTree } from '../hooks/useDocumentTree'

interface DocumentTreeProps {
  nodes: Readonly<Record<string, TreeNode>>
  /** The id of the row of the page on screen. */
  currentId: string | undefined
  onRetry: () => void
}

function RowCount({ count }: { count: number }) {
  return <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
}

function RowLetter({ look }: { look: RowLook }) {
  return (
    <ColoredText
      aria-hidden
      color={look.color}
      className="w-3 shrink-0 text-center font-mono text-xs"
    >
      {look.letter}
    </ColoredText>
  )
}

/** The icon before the title of a row that has one, in the color of the row, else muted. */
function RowIcon({ name, look }: { name: TreeNode['icon']; look: RowLook }) {
  const icon = useTabIcon(name ?? undefined)
  if (!icon) return null
  return (
    <ColoredText
      aria-hidden
      color={look.color ?? 'muted'}
      className="flex shrink-0 [&_svg]:size-3.5"
    >
      {icon}
    </ColoredText>
  )
}

function RowContent({ node, item }: { node: TreeNode; item: ItemInstance<TreeNode> }) {
  const { count, location } = node
  const look = item.isExpanded() ? node.look : node.collapsedLook
  const hasCount = count !== null && count > 0 && !item.isExpanded()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <RowIcon name={node.icon} look={look} />
          <ColoredText color={look.color} className="min-w-0 flex-1 truncate text-left">
            {node.name}
          </ColoredText>
          {hasCount && <RowCount count={count} />}
          <RowLetter look={look} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        {/* The path down to the row ends with its own title, which the row may cut short. */}
        <span className="flex flex-col">
          <span>{documentsMessages.location([...location, node.name])}</span>
          {look.text !== null && <span>{look.text}</span>}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The documents of the project as a tree: a line guides each level, the title of a row takes the
 * color of what it asks of the user, and a letter at its end says which state. The row of the page
 * on screen is the current one. A click opens the page in the preview tab, a double click keeps it.
 */
export function DocumentTree({ nodes, currentId, onRetry }: DocumentTreeProps) {
  const { tree, indent, open } = useDocumentTree(nodes, onRetry)

  useScrollIntoView(
    () => (currentId === undefined ? undefined : tree.getItemInstance(currentId).getElement()),
    currentId ?? null,
  )

  return (
    <Tree indent={indent} tree={tree} guides aria-label={documentsMessages.title} className="pb-2">
      {tree.getItems().map((item) => {
        const node = item.getItemData()
        const isCurrent = item.getId() === currentId
        return (
          <TreeItem
            key={item.getId()}
            item={item}
            aria-current={isCurrent ? 'page' : undefined}
            onDoubleClick={() => {
              open(item.getId(), { keep: true })
            }}
          >
            <TreeItemLabel
              className={cn(
                // The pointer over a row takes the text color instead of a fill; the row of the
                // page on screen keeps a fill and the text color too. A row with a color of its own
                // (what asks something) keeps it.
                'w-full hover:bg-transparent hover:text-foreground [&:hover_[data-color=muted]]:text-foreground',
                isCurrent &&
                  'bg-accent text-foreground hover:bg-accent [&_[data-color=muted]]:text-foreground!',
              )}
            >
              <RowContent node={node} item={item} />
            </TreeItemLabel>
          </TreeItem>
        )
      })}
    </Tree>
  )
}
