'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

import type { SidebarNavItemConfig } from './app-sidebar.config'

interface SidebarNavItemProps {
  item: SidebarNavItemConfig
}

/** One sidebar menu entry: a link when the item has `href`, otherwise a disabled button. */
export function SidebarNavItem({ item }: SidebarNavItemProps) {
  const pathname = usePathname()
  const { label, icon: Icon, href, tooltip = label } = item

  return (
    <SidebarMenuItem>
      {href === undefined ? (
        <SidebarMenuButton disabled tooltip={tooltip}>
          <Icon aria-hidden />
          <span>{label}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton asChild tooltip={tooltip} isActive={pathname === href}>
          <Link href={href}>
            <Icon aria-hidden />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}
