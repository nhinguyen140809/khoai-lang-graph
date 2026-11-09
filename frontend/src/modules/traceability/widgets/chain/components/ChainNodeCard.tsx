'use client'

import { type NodeProps, Position } from '@xyflow/react'
import { cn } from 'cn'
import { MoreHorizontalIcon } from 'lucide-react'
import { type MouseEvent, useState } from 'react'

import { useOpenItemActions } from '@/modules/artifact/features/open-item'
import { useEditLockReason } from '@/modules/documents/entities'
import { useProjectId } from '@/modules/project/entities'
import type { ChainNodeData } from '@/modules/trace/entities'
import { useAddLinkAction } from '@/modules/trace/features/add-link'
import { useViewTraceAction } from '@/modules/trace/features/view-trace'
import { Button } from '@/shared/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Handle } from '@/shared/components/ui/handle'
import { ContextActionItem, DropdownActionItem } from '@/shared/components/ui/menu-action'
import { Node, NodeHeader, NodeHeaderTitle } from '@/shared/components/ui/node'
import { RecordNameTooltip } from '@/shared/components/ui/record-name'

import { itemTraceMessages } from '../item-trace.constants'
import type { ChainFlowNode } from '../item-trace.types'
import { chainNodeProps } from '../item-trace.utils'

/**
 * A click on the button of the menu of a node, or on the menu, is not a click on the node: the
 * menu opens, or runs its action, and the page of the item does not open under it. The menus sit in
 * a layer of their own, yet a click still reaches the node through the components that hold them.
 */
function keepClickInMenu(event: MouseEvent) {
  event.stopPropagation()
}

/**
 * The card of one node of the chain: its kind and its title, painted by the review status of its
 * item; the item of the page takes a fill. A node takes the same room whatever is chosen on the
 * canvas, so the chain stays still. A right click opens the menu of the item, and its "..." button
 * opens the same content from a menu of its own, anchored to the button.
 */
export function ChainNodeCard({ data }: NodeProps<ChainFlowNode>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Node
          {...chainNodeProps({
            status: data.reviewStatus,
            attention: data.attention.level,
            isSubject: data.isFocus,
          })}
          className="group w-44 text-left"
        >
          {/* The ends of the links, drawn as the graph card of the design system draws them. The
              chain reads from the right to the interviews on the left, so a link leaves its
              source at the left and arrives at its target on the right, the arrow pointing left. */}
          <Handle type="source" position={Position.Left} />
          <NodeHeader className="mb-0 gap-2 pb-0">
            <span className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground in-data-[variant=solid]:text-(--tone-foreground)">
              {data.kindTitle}
            </span>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    // The button is taller than the kind it sits beside; its margin keeps the row the height of
                    // the text, so the kind stays close to the title under it.
                    'nodrag nopan -my-1 shrink-0 in-data-[variant=solid]:text-(--tone-foreground)',
                    isMenuOpen
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
                  )}
                  aria-label={itemTraceMessages.menu.more(data.title)}
                  onClick={keepClickInMenu}
                >
                  <MoreHorizontalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" onClick={keepClickInMenu}>
                <NodeMenuContent node={data} kind="dropdown" />
              </DropdownMenuContent>
            </DropdownMenu>
          </NodeHeader>
          <div className="px-3 pt-0.5 pb-2">
            <NodeHeaderTitle className="line-clamp-2 text-sm">
              <RecordNameTooltip kind={data.kindTitle} title={data.title} code={data.key}>
                <span>{data.title}</span>
              </RecordNameTooltip>
            </NodeHeaderTitle>
          </div>
          <Handle type="target" position={Position.Right} />
        </Node>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48" onClick={keepClickInMenu}>
        <NodeMenuContent node={data} kind="context" />
      </ContextMenuContent>
    </ContextMenu>
  )
}

/**
 * The menu of a node: the ways to open its item, and the action of linking it to another. The items
 * come in one kind per menu: the dropdown of the "..." button or the context menu of a right click.
 */
function NodeMenuContent({ node, kind }: { node: ChainNodeData; kind: 'dropdown' | 'context' }) {
  const ActionItem = kind === 'dropdown' ? DropdownActionItem : ContextActionItem
  const projectId = useProjectId()
  const { open, openInNewTab } = useOpenItemActions(projectId)({ id: node.id, title: node.title })
  const viewTrace = useViewTraceAction(projectId)({ id: node.id, title: node.title })
  const lockedReason = useEditLockReason(projectId, node.artifactId)
  const addLink = useAddLinkAction({ id: node.id, kind: node.kind }, lockedReason)

  return (
    <>
      {[open, openInNewTab, viewTrace].map(({ icon, label, disabledReason, run }) => (
        <ActionItem
          key={label}
          icon={icon}
          label={label}
          disabledReason={disabledReason}
          onSelect={run}
        />
      ))}
      {addLink !== null && (
        <ActionItem
          icon={addLink.icon}
          label={addLink.label}
          disabledReason={addLink.disabledReason}
          onSelect={addLink.run}
        />
      )}
    </>
  )
}
