'use client'

import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { initialsOf } from '@/shared/lib/formatters'
import type { Tone } from '@/shared/lib/tone'

/**
 * The initials of a name on the soft fill of a tone. The name sits beside the avatar, so the
 * initials are hidden from assistive technology.
 */
export function InitialsAvatar({
  name,
  tone,
  size = 'default',
}: {
  name: string
  tone: Tone
  size?: 'sm' | 'default' | 'lg'
}) {
  return (
    <Avatar aria-hidden size={size}>
      <AvatarFallback variant="soft" color={tone}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  )
}
