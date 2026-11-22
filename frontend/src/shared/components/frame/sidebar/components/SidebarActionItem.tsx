'use client'

import type { ReactNode } from 'react'

import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar'

interface SidebarActionItemProps {
  /** What the row says, and the tooltip of its icon on the rail. */
  label: string
  onClick: () => void
  /** The classes of the row, such as its text color. */
  className?: string
  /** The icon of the action. */
  children: ReactNode
}

/**
 * A row of a `SidebarMenu` that does an action, such as starting new work: its icon and its label,
 * and on the rail of a folded side list its icon alone, with the label as its tooltip.
 * @view user
 */
export function SidebarActionItem({ label, onClick, className, children }: SidebarActionItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label} onClick={onClick} className={className}>
        {children}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
