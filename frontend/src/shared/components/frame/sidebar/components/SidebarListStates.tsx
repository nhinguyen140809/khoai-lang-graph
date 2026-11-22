'use client'

import { RotateCcwIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar'

interface SidebarRetryItemProps {
  /** What failed, and that choosing the row tries again. */
  label: string
  onRetry: () => void
}

/**
 * A list of the side list that failed to load: one row, which loads it again.
 * @view user
 */
export function SidebarRetryItem({ label, onRetry }: SidebarRetryItemProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={onRetry}>
          <RotateCcwIcon aria-hidden />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * A line of quiet text in the side list, such as what a list without an item says.
 * @view user
 */
export function SidebarNote({ children }: { children: ReactNode }) {
  return <p className="px-2 py-1.5 text-sm text-muted-foreground">{children}</p>
}
