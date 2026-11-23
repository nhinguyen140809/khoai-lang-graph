import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'

import { colorOf } from '@/shared/lib/palette'

import { thumbnailIcons } from './thumbnail.constants'

/** The color of a thumbnail as the custom property that its classes read: one color of the palette, by its seed. */
export function thumbnailStyleOf(seed: string): CSSProperties {
  return { '--thumbnail-color': colorOf(seed) } as CSSProperties
}

/** The icon that a name stands for, as a kind of document or item names it; nothing for a name that is not known. */
export function thumbnailIconNamed(name: string | null | undefined): LucideIcon | undefined {
  return name === null || name === undefined ? undefined : thumbnailIcons[name]
}
