'use client'

import type { DrawnIconProps } from './icon.types'
import { ScrollingLines } from './ScrollingLines'

/** Lines of text that start at the left and slide up without end: the mark of a text that is read. */
export function TextLeftIcon(props: DrawnIconProps) {
  return <ScrollingLines {...props} align="left" />
}
