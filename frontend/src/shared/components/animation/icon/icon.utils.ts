import { defaultIconStroke, iconExtent } from './icon.constants'
import type { IconBounds } from './icon.types'

/** How much an icon is scaled so that what it draws takes `iconExtent`; 1 for an icon that is not measured. */
export function scaleOf(bounds: IconBounds | undefined): number {
  return bounds === undefined ? 1 : iconExtent / bounds.size
}

/** The transform that puts what an icon draws in the middle of its 24 by 24 frame, at the size that `iconExtent` says. */
export function fitOf(bounds: IconBounds | undefined): string | undefined {
  if (bounds === undefined) return undefined
  const scale = scaleOf(bounds)
  return `translate(${String(12 - bounds.x * scale)} ${String(12 - bounds.y * scale)}) scale(${String(scale)})`
}

/**
 * How thick a stroke is on the screen: `stroke` units of the 24 by 24 frame, the default when none is
 * given, `factor` times for a mark that is drawn heavier or lighter than the rest. An icon that is
 * scaled to fit (`bounds`) gets its stroke made thicker or thinner to match, so that the strokes
 * of all the icons are as thick as one another.
 */
export function strokeOf(stroke: number | undefined, factor = 1, bounds?: IconBounds): number {
  return ((stroke ?? defaultIconStroke) * factor) / scaleOf(bounds)
}
