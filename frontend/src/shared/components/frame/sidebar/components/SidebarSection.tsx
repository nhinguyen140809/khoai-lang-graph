'use client'

import { ChevronRightIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/shared/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface SidebarSectionProps {
  title: string
  /** The action of the section, a `SidebarSectionAction` at the end of its title. */
  action?: ReactNode
  /** Whether the section starts open; it does by default. */
  defaultOpen?: boolean | undefined
  children: ReactNode
}

/**
 * A section of the side list: its title, which folds and unfolds it, with a chevron that turns as
 * it opens, its action at the end of the title, and its content. The rail of a folded side list
 * shows no section.
 */
export function SidebarSection({
  title,
  action,
  defaultOpen = true,
  children,
}: SidebarSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/section">
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel
          asChild
          className="w-full gap-1 pr-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CollapsibleTrigger>
            <span className="truncate">{title}</span>
            <ChevronRightIcon
              aria-hidden
              className="transition-transform group-data-[state=open]/section:rotate-90 motion-reduce:transition-none"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        {action}
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

interface SidebarSectionActionProps extends ComponentProps<typeof SidebarGroupAction> {
  /** The name of the action, read by assistive technology and shown in its tooltip. */
  label: string
}

/**
 * The action of a section, an icon at the end of its title. On a wide screen it shows while the
 * section is hovered or holds the focus; on a narrow one it always shows.
 */
export function SidebarSectionAction({ label, children, ...props }: SidebarSectionActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarGroupAction
          className="group-focus-within/section:opacity-100 group-hover/section:opacity-100 aria-expanded:opacity-100 md:opacity-0"
          {...props}
        >
          {children}
          <span className="sr-only">{label}</span>
        </SidebarGroupAction>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
