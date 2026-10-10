import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import type * as React from 'react'

import { type GraphTone, graphToneClasses } from '@/lib/tone.constants'

// `variant` is the fill and `color` the meaning, a tone or a chart color; the color sets the
// --tone variables these read. The header text of a chart color keeps the text color.
// Hover and selection keep the color of the node: a ring of the strong color surrounds it, light
// on hover and darker while selected, and the border of outline and soft nodes takes that color.
const nodeVariants = cva(
  [
    'relative rounded-md border text-xs/relaxed transition-[border-color,box-shadow]',
    'hover:ring-[3px] hover:ring-(--tone-strong)/20',
    'flow-selected:shadow-lg flow-selected:ring-[3px] flow-selected:ring-(--tone-strong)/40',
  ],
  {
    variants: {
      variant: {
        outline: '',
        // The soft fill is translucent, so it is laid over the card color to hide the canvas.
        soft: 'bg-[linear-gradient(var(--tone-soft),var(--tone-soft))]',
        solid: 'border-transparent bg-(--tone) text-(--tone-foreground)',
      },
      color: graphToneClasses,
    },
    compoundVariants: [
      {
        variant: ['outline', 'soft'],
        class:
          'border-(--tone-border) bg-card text-card-foreground hover:border-(--tone-strong) *:data-[slot=node-header]:text-[var(--tone-text,var(--tone-strong))] flow-selected:border-(--tone-strong)',
      },
    ],
  },
)

type NodeVariant = 'outline' | 'soft' | 'solid'

function Node({
  className,
  variant = 'outline',
  color = 'neutral',
  ...props
}: Omit<React.ComponentProps<'div'>, 'color'> & {
  variant?: NodeVariant | undefined
  color?: GraphTone | undefined
}) {
  return (
    <div
      data-slot="node"
      data-variant={variant}
      data-color={color}
      className={cn(nodeVariants({ variant, color }), className)}
      {...props}
    />
  )
}

/** A header row for a Node: a title and, on the right, badges or actions. */
function NodeHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      data-slot="node-header"
      className={cn('-mb-1 flex items-center justify-between gap-2 px-3 py-2', className)}
      {...props}
    />
  )
}

function NodeHeaderTitle({ className, children, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="node-title"
      className={cn('flex-1 text-xs font-medium select-none', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function NodeContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="node-content"
      className={cn('flex flex-col gap-y-2 p-3', className)}
      {...props}
    />
  )
}

function NodeFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="node-footer"
      className={cn('flex flex-col items-center gap-y-2 border-t px-3 pt-2 pb-3', className)}
      {...props}
    />
  )
}

export { Node, NodeContent, NodeFooter, NodeHeader, NodeHeaderTitle, type NodeVariant }
