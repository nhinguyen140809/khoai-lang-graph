'use client'

import type { ReactNode } from 'react'

import { nonStatusTone } from '@/modules/workflow/entities/@x/documents'
import { InitialsAvatar } from '@/shared/components/ui/initials-avatar'

interface ItemHeadingProps {
  /** Whether an avatar leads the title, as the page layout of the item decides. */
  hasAvatar: boolean
  title: string
  /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
  place: number
  /** What stands right under the title, beside the avatar: the key line of the item. */
  children?: ReactNode
}

/**
 * The heading of an item page: its title, after the avatar of the item when its page layout has
 * one, in the tone of the card it is drawn on. The avatar is large, and what stands under the title
 * stands beside it, so the title and its lines read as one block.
 */
export function ItemHeading({ hasAvatar, title, place, children }: ItemHeadingProps) {
  if (!hasAvatar) return <h1 className="text-2xl font-semibold">{title}</h1>

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5">
      <InitialsAvatar name={title} tone={nonStatusTone(place)} size="xl" />
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
