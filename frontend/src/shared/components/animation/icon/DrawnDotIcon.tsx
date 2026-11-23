import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/**
 * A small filled dot, a third of the frame wide. It is not drawn over the round: it is there from
 * the start, so that its place and its motion are what the eye follows.
 */
export function DrawnDotIcon({ className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke}>
      <circle cx={12} cy={12} r={4} fill="currentColor" stroke="none" />
    </IconFrame>
  )
}
