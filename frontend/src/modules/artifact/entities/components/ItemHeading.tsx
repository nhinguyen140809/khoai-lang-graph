'use client'

import {
  type ContentSchema,
  InitialsAvatar,
  type ItemPageLayout,
  nonStatusTone,
  pageLayoutOf,
} from '@/modules/workflow/entities/@x/artifact'

// Whether an avatar leads the title of the page, by the page layout.
const headingAvatars = { fields: false, profile: true } as const satisfies Record<
  ItemPageLayout,
  boolean
>

interface ItemHeadingProps {
  schema: ContentSchema | undefined
  title: string
  /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
  place: number
}

/**
 * The heading of an item page: its title, after the avatar of the item when its page layout
 * (`pageLayoutOf`) has one in `headingAvatars`, in the tone of the card it is drawn on. The key of
 * the item sits on the key line, under the title.
 */
export function ItemHeading({ schema, title, place }: ItemHeadingProps) {
  const hasAvatar = schema !== undefined && headingAvatars[pageLayoutOf(schema)]
  return (
    <>
      {hasAvatar && <InitialsAvatar name={title} tone={nonStatusTone(place)} size="lg" />}
      <h1 className="text-2xl font-semibold">{title}</h1>
    </>
  )
}
