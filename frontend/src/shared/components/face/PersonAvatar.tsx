'use client'

import { InitialsAvatar } from '@/shared/components/ui/initials-avatar'
import type { Tone } from '@/shared/lib/tone'

import type { FaceSpec } from './human/human-face.types'
import { HumanFace } from './human/HumanFace'

/** The size of the face that each size of the avatar takes: the face has one more of its own, and the sizes beside it. */
const faceSizes = { sm: 'sm', default: 'default', lg: 'lg', xl: '2xl' } as const

/** The sizes an avatar of a person comes in, named as the initials of a name name them. */
export type PersonAvatarSize = keyof typeof faceSizes

interface PersonAvatarProps {
  /** The name of the person, whose initials stand in when there is no face. */
  name: string
  tone: Tone
  /** The face the person chose; null draws the initials. */
  spec: FaceSpec | null
  /** The key of the item the face belongs to, from which it draws what its spec does not name. */
  seed: string
  size?: PersonAvatarSize
}

/**
 * The avatar of a person: the face their spec names, or else the initials of their name on the soft
 * fill of a tone. Like the initials, the face is hidden from assistive technology, since the name
 * sits beside it.
 */
export function PersonAvatar({ name, tone, spec, seed, size = 'default' }: PersonAvatarProps) {
  if (spec !== null) return <HumanFace seed={seed} spec={spec} size={faceSizes[size]} />
  return <InitialsAvatar name={name} tone={tone} size={size} />
}
