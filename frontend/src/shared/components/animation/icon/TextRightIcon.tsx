'use client'

import type { DrawnIconProps } from './icon.types'
import { ScrollingLines } from './ScrollingLines'

/** Lines of text that end at the right and slide up without end: the mark of a text that is written. */
export function TextRightIcon(props: DrawnIconProps) {
  return <ScrollingLines {...props} align="right" />
}
