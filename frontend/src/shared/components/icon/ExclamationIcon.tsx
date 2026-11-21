import { createLucideIcon, type LucideIcon } from 'lucide-react'

/** An exclamation mark alone, in the stroke of the lucide icons: a line over a point. */
export const ExclamationIcon: LucideIcon = createLucideIcon('Exclamation', [
  ['path', { d: 'M12 5v9', key: 'line' }],
  ['path', { d: 'M12 19h.01', key: 'point' }],
])
