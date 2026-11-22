'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Menu, MenuContent, MenuTrigger } from '@/shared/components/menu'
import {
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/cn'

import { useSidebarLink } from '../hooks/useSidebarLink'

interface SidebarLinkItemProps {
  href: Route
  /** The name of the link, when it says more than the row shows, such as a status after a name. */
  label?: string
  /** The whole name of the row, shown in a tooltip beside it when the row cuts it short. */
  tooltip?: string
  /** A mark at the end of the row, such as the icon of a status; it is hidden from screen readers. On a wide screen it gives way to the action with a short fade, also while the menu of the action is open. */
  badge?: ReactNode
  /** The action at the end of the row, such as a `SidebarItemMenu`. */
  action?: ReactNode
  className?: string
  /** What the row shows: a text, after an icon or not. */
  children: ReactNode
}

/**
 * A row of a `SidebarMenu` that links to a page: marked while its page is on show, and closing the
 * side list on a narrow screen when it opens. On a wide screen the action takes the place of the
 * mark while the row is hovered or holds the focus; on a narrow one both show, the mark first.
 * @view user
 */
export function SidebarLinkItem({
  href,
  label,
  tooltip,
  badge,
  action,
  className,
  children,
}: SidebarLinkItemProps) {
  const { isActive, onOpen } = useSidebarLink(href)

  return (
    <SidebarMenuItem data-badge={badge === undefined ? undefined : ''}>
      <RowTooltip text={tooltip}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn('max-md:group-data-badge/menu-item:pr-14', className)}
        >
          <Link
            href={href}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={onOpen}
          >
            {children}
          </Link>
        </SidebarMenuButton>
      </RowTooltip>
      {badge !== undefined && (
        <SidebarMenuBadge
          aria-hidden
          className="transition duration-base motion-reduce:transition-none max-md:right-8 md:group-focus-within/menu-item:scale-75 md:group-focus-within/menu-item:opacity-0 md:group-hover/menu-item:scale-75 md:group-hover/menu-item:opacity-0 md:group-has-aria-expanded/menu-item:scale-75 md:group-has-aria-expanded/menu-item:opacity-0"
        >
          {badge}
        </SidebarMenuBadge>
      )}
      {action}
    </SidebarMenuItem>
  )
}

/** The row with the whole of its name in a tooltip at its side; the row as it is without a name. */
function RowTooltip({ text, children }: { text: string | undefined; children: ReactNode }) {
  if (text === undefined) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{text}</TooltipContent>
    </Tooltip>
  )
}

interface SidebarItemMenuProps {
  /** The name of the button that opens the menu, such as "Actions for Mentor platform". */
  label: string
  /** The items of the menu. */
  children: ReactNode
}

/**
 * The menu at the end of a row of the side list: a button that shows while the row is hovered or
 * holds the focus, and always on a narrow screen, and the menu it opens: beside the side list on a
 * wide screen, a sheet from the foot of the screen on a narrow one. Its items are the items of
 * `Menu`.
 * @view user
 */
export function SidebarItemMenu({ label, children }: SidebarItemMenuProps) {
  return (
    <Menu>
      <MenuTrigger>
        <SidebarMenuAction
          showOnHover
          className="transition duration-base motion-reduce:transition-none md:not-group-hover/menu-item:not-group-focus-within/menu-item:not-aria-expanded:scale-75"
        >
          <MoreHorizontalIcon aria-hidden />
          <span className="sr-only">{label}</span>
        </SidebarMenuAction>
      </MenuTrigger>
      <MenuContent title={label} side="right" align="start" className="w-40">
        {children}
      </MenuContent>
    </Menu>
  )
}
