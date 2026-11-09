'use client'

import { nonStatusTone } from '@/modules/workflow/entities'
import { InitialsAvatar } from '@/shared/components/ui/initials-avatar'

interface ItemHeadingProps {
  /** Whether an avatar leads the title, as the page layout of the item decides. */
  hasAvatar: boolean
  title: string
  /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
  place: number
}

/**
 * The heading of an item page: its title, after the avatar of the item when its page layout has
 * one, in the tone of the card it is drawn on. The key of
 * the item sits on the key line, under the title.
 */
export function ItemHeading({ hasAvatar, title, place }: ItemHeadingProps) {
  return (
    <>
      {hasAvatar && <InitialsAvatar name={title} tone={nonStatusTone(place)} size="lg" />}
      <h1 className="text-2xl font-semibold">{title}</h1>
    </>
  )
}
