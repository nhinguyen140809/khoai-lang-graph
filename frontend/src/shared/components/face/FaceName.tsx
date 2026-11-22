'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'

import { useFacePlace } from './hooks/useFacePlace'
import { useFaceRules } from './hooks/useFaceRules'
import { faceOf } from './look/face-look.utils'
import { textStyleOf } from './look/face-style.utils'

interface FaceNameProps {
  /** What the face comes from; the same seed as the face beside the name. */
  seed: string
  /** The place of the agent in its workflow, when the face beside the name was given one. */
  place?: number | undefined
  children: ReactNode
  className?: string
}

/** The name of an agent, in the colors of its face. */
export function FaceName({ seed, place, children, className }: FaceNameProps) {
  const rules = useFaceRules()
  const placed = useFacePlace(seed, place)
  return (
    <span className={cn('face-text', className)} style={textStyleOf(faceOf(seed, rules, placed))}>
      {children}
    </span>
  )
}
