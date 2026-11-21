import type { CSSProperties } from 'react'

import { colorOf } from '@/shared/lib/palette'

/** The color of a thumbnail as the custom property that its classes read: one color of the palette, by its seed. */
export function thumbnailStyleOf(seed: string): CSSProperties {
  return { '--thumbnail-color': colorOf(seed) } as CSSProperties
}
