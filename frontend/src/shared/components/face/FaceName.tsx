import { cn } from 'cn'
import type { ReactNode } from 'react'

import { faceOf } from './face-look.utils'
import { textStyleOf } from './face-style.utils'

interface FaceNameProps {
  /** What the face comes from; the same seed as the face beside the name. */
  seed: string
  children: ReactNode
  className?: string
}

/** The name of an agent, in the colors of its face. */
export function FaceName({ seed, children, className }: FaceNameProps) {
  return (
    <span className={cn('face-text', className)} style={textStyleOf(faceOf(seed))}>
      {children}
    </span>
  )
}
