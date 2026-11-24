'use client'

import type { ReactNode } from 'react'

import { nonStatusTone } from '@/modules/workflow/entities/@x/documents'
import { type FaceSpec, HumanFace } from '@/shared/components/face'
import { InitialsAvatar } from '@/shared/components/ui/initials-avatar'

interface ItemHeadingProps {
  /** Whether an avatar leads the title, as the page layout of the item decides. */
  hasAvatar: boolean
  title: string
  /** The place of the item among the items of its document, from 1, which gives the tone of its avatar. */
  place: number
  /** The key of the item, from which the face draws what its spec does not name. */
  faceSeed?: string
  /** The face of the item, where it chose one; its initials stand in when it has none. */
  face?: FaceSpec | null
  /** What stands right under the title, beside the avatar: the key line of the item. */
  children?: ReactNode
}

/**
 * The heading of an item page: its title, after the avatar of the item when its page layout has
 * one, in the tone of the card it is drawn on. The avatar is large - the face of the item where
 * it chose one, else its initials - and what stands under the title stands beside it, so the
 * title and its lines read as one block.
 */
export function ItemHeading({
  hasAvatar,
  title,
  place,
  faceSeed,
  face,
  children,
}: ItemHeadingProps) {
  if (!hasAvatar) return <h1 className="text-2xl font-semibold">{title}</h1>

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5">
      {face !== undefined && face !== null && faceSeed !== undefined ? (
        <HumanFace seed={faceSeed} spec={face} size="2xl" />
      ) : (
        <InitialsAvatar name={title} tone={nonStatusTone(place)} size="xl" />
      )}
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
