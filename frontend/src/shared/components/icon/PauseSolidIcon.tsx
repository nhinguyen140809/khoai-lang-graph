import type { LucideIcon, LucideProps } from 'lucide-react'
import { PauseIcon } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * The Pause of an interrupted status, filled with the color of its stroke: the shape of the
 * lucide icon untouched, with only the fill of its closed outline turned on, so the bars read
 * as held, and a line thinner than the one of the outline icons, so the fill does not read
 * heavy. The color still comes from the text around it, as with every lucide icon.
 */
export const PauseSolidIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  function PauseSolidIcon(props, ref) {
    return <PauseIcon ref={ref} {...props} fill="currentColor" stroke="none" />
  },
)
