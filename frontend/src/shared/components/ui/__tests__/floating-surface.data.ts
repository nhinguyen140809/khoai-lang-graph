import type { ComponentProps } from 'react'

import type { FloatingSurface } from '../floating-surface'

/** How the surface renders with some props, and the classes it takes. */
export type FloatingSurfaceCase = {
  name: string
  props: Partial<ComponentProps<typeof FloatingSurface>>
  classes: string[]
}

/** The surface at a corner, an offset, a variant or a size, and where that puts it. */
export const surfaceCases: FloatingSurfaceCase[] = [
  {
    name: 'at the bottom-right corner, the defaults',
    props: {},
    classes: [
      'absolute',
      'bottom-4',
      'right-4',
      'z-20',
      'w-fit',
      'shadow-lg',
      'bg-background',
      'p-3',
    ],
  },
  {
    name: 'at the top-left corner',
    props: { placement: 'top-left' },
    classes: ['top-4', 'left-4'],
  },
  {
    name: 'at the top-right corner',
    props: { placement: 'top-right' },
    classes: ['top-4', 'right-4'],
  },
  {
    name: 'at the bottom-left corner',
    props: { placement: 'bottom-left' },
    classes: ['bottom-4', 'left-4'],
  },
  {
    name: 'against the edges of its placement',
    props: { offset: 'none' },
    classes: ['bottom-0', 'right-0'],
  },
  {
    name: 'close to the edges of its placement',
    props: { offset: 'sm' },
    classes: ['bottom-2', 'right-2'],
  },
  {
    name: 'far from the edges of its placement',
    props: { offset: 'lg' },
    classes: ['bottom-6', 'right-6'],
  },
  {
    name: 'in the popover color',
    props: { variant: 'popover' },
    classes: ['bg-popover', 'text-popover-foreground'],
  },
  {
    name: 'as a blur of what floats under it',
    props: { variant: 'glass' },
    classes: ['bg-background/80', 'supports-backdrop-filter:backdrop-blur'],
  },
  {
    name: 'small',
    props: { size: 'sm' },
    classes: ['p-2'],
  },
  {
    name: 'large',
    props: { size: 'lg' },
    classes: ['p-4'],
  },
  {
    name: 'in the middle of the top edge',
    props: { placement: 'top-center' },
    classes: ['top-4', 'left-1/2', '-translate-x-1/2'],
  },
  {
    name: 'in the middle of the bottom edge',
    props: { placement: 'bottom-center', offset: 'sm' },
    classes: ['bottom-2', 'left-1/2', '-translate-x-1/2'],
  },
  {
    name: 'with a border and a tint of its color',
    props: { color: 'warning' },
    classes: ['border-(--tone-border)', 'from-(--tone-soft)', 'to-(--tone-soft)'],
  },
]
