'use client'

import { MessageSquareTextIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar'

import { useThreads } from '../hooks/useThreads'

// The state messages are text, so they are hidden when the sidebar is collapsed to icons.
const stateItemClassName = 'group-data-[collapsible=icon]:hidden'

/** Existing threads as sidebar menu items; render inside a <SidebarMenu>. */
export function ThreadList() {
  const pathname = usePathname()
  const threads = useThreads()

  if (threads.isPending) {
    return (
      <SidebarMenuItem className={stateItemClassName}>
        <LoadingState label="Loading threads" rows={3} size="compact" />
      </SidebarMenuItem>
    )
  }

  if (threads.isError) {
    return (
      <SidebarMenuItem className={stateItemClassName}>
        <ErrorState
          message={threads.error.message}
          onRetry={() => void threads.refetch()}
          size="compact"
        />
      </SidebarMenuItem>
    )
  }

  if (threads.data.length === 0) {
    return (
      <SidebarMenuItem className={stateItemClassName}>
        <EmptyState title="No threads yet" size="compact" />
      </SidebarMenuItem>
    )
  }

  return threads.data.map((thread) => {
    const href = `/threads/${encodeURIComponent(thread.id)}` as const
    return (
      <SidebarMenuItem key={thread.id}>
        <SidebarMenuButton asChild tooltip={thread.title} isActive={pathname === href}>
          <Link href={href}>
            <MessageSquareTextIcon aria-hidden />
            <span>{thread.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  })
}
