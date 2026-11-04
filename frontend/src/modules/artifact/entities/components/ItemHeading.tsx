'use client'

import {
  type ContentSchema,
  InitialsAvatar,
  type ItemPageLayout,
  nonStatusTone,
  pageLayoutOf,
} from '@/modules/workflow/entities/@x/artifact'

import type { ArtifactItem } from '../items/items.types'

// Whether an avatar leads the title of the page, by the page layout.
const headingAvatars = { fields: false, profile: true } as const satisfies Record<
  ItemPageLayout,
  boolean
>

interface ItemHeadingProps {
  item: ArtifactItem
  schema: ContentSchema | undefined
  title: string
  /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
  place: number
}

/**
 * The heading of an item page: its title, the key of the item beside it, after the avatar of the
 * item when its page layout (`pageLayoutOf`) has one in `headingAvatars`, in the tone of the card
 * it is drawn on.
 */
export function ItemHeading({ item, schema, title, place }: ItemHeadingProps) {
  const hasAvatar = schema !== undefined && headingAvatars[pageLayoutOf(schema)]
  return (
    <>
      {hasAvatar && <InitialsAvatar name={title} tone={nonStatusTone(place)} size="lg" />}
      <span className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <span className="font-mono text-xs text-muted-foreground">{item.key}</span>
      </span>
    </>
  )
}
