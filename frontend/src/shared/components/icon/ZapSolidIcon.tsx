import type { LucideIcon, LucideProps } from 'lucide-react'
import { ZapIcon } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * The Zap of a running status, filled with the color of its stroke: the shape of the lucide
 * icon untouched, with only the fill of its closed outline turned on, so the bolt reads as
 * charged, and a line thinner than the one of the outline icons, so the fill does not read
 * heavy. The color still comes from the text around it, as with every lucide icon.
 */
export const ZapSolidIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  function ZapSolidIcon(props, ref) {
    return <ZapIcon ref={ref} {...props} fill="currentColor" stroke="none" />
  },
)
