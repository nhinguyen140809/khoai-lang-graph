'use client'

import type { ReactNode } from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from '@/shared/components/ui/sidebar'

import { sidebarFooterItems, type SidebarGroupId, sidebarGroups } from './app-sidebar.config'
import { SidebarNavItem } from './SidebarNavItem'

interface AppSidebarProps {
  /** Menu items loaded at run time, rendered after the static items of the given group. */
  groupItems?: Partial<Record<SidebarGroupId, ReactNode>>
}

/** Renders the sidebar from app-sidebar.config.ts; add or reorder entries there. */
export function AppSidebar({ groupItems = {} }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3 font-semibold">Khoailanggraph</SidebarHeader>
      <SidebarContent>
        {sidebarGroups.map(({ id, label, items }) => (
          <SidebarGroup key={id}>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarNavItem key={item.label} item={item} />
                ))}
                {groupItems[id]}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {sidebarFooterItems.map((item) => (
            <SidebarNavItem key={item.label} item={item} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
