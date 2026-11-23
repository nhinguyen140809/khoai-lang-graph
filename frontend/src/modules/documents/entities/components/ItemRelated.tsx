'use client'

import { ChevronDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'

import { itemLinkMessages } from '../constants/documents.constants'

/**
 * What an item is linked to, at the foot of the page of a profile, folded under a line that opens
 * it: the page is about the item, and what it is linked to is for whoever goes on to look. It is
 * closed until opened, and grows and shrinks over a short time, so the page under it does not jump.
 */
export function ItemRelated({ children }: { children: ReactNode }) {
  return (
    <Collapsible className="pt-2">
      <h2>
        <CollapsibleTrigger className="group flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50">
          {itemLinkMessages.relations}
          <ChevronDownIcon
            aria-hidden
            className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      </h2>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
