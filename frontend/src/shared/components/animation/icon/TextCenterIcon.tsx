'use client'

import type { DrawnIconProps } from './icon.types'
import { ScrollingLines } from './ScrollingLines'

/** Lines of text that are centered and slide up without end: the mark of a text that is laid out. */
export function TextCenterIcon(props: DrawnIconProps) {
  return <ScrollingLines {...props} align="center" />
}
