import { type Shot, visit } from '../screenshot.utils'

/** The design system page, at its whole length. */
export const designSystemShots: Shot[] = [
  { name: 'Components in both themes', steps: visit('/design-system'), fullPage: true },
]
