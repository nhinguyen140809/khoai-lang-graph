'use client'

import { MessageSquareTextIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

import { useThreads } from '../hooks/useThreads'

/** Existing threads as sidebar menu items; render inside a <SidebarMenu>. */
export function ThreadList() {
  const pathname = usePathname()
  const threads = useThreads()

  if (threads.isPending) {
    return (
      <li className="flex flex-col gap-2 px-2 py-1" aria-busy="true" aria-label="Loading threads">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </li>
    )
  }

  if (threads.isError) {
    return (
      <li role="alert" className="px-2 py-1 text-xs text-destructive">
        {threads.error.message}
      </li>
    )
  }

  if (threads.data.length === 0) {
    return <li className="px-2 py-1 text-xs text-muted-foreground">No threads yet</li>
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
