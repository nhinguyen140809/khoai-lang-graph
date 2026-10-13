import { BaseEdge, type BaseEdgeProps } from '@xyflow/react'
import { cn } from 'cn'

import { type GraphTone, graphToneClasses } from '@/shared/lib/tone.constants'

const lineStyles = {
  solid: '',
  dashed: '[stroke-dasharray:6_4]',
  dotted: '[stroke-dasharray:1_2]',
} as const

type EdgeVariant = keyof typeof lineStyles

/**
 * An edge path: `variant` is the line style and `color` the meaning. React Flow draws the path
 * and the label with the --xy-edge-* variables set here, and switches to the selected stroke
 * itself. A neutral edge is muted at rest and takes the text color while selected. A chart color
 * strokes the line; the label keeps the text color.
 */
function Edge({
  path,
  variant = 'solid',
  color = 'neutral',
  className,
  ...props
}: Omit<BaseEdgeProps, 'color'> & {
  variant?: EdgeVariant | undefined
  color?: GraphTone | undefined
}) {
  return (
    <g
      data-slot="edge"
      data-variant={variant}
      data-color={color}
      className={cn(
        'group/edge [--xy-edge-label-color:var(--tone-text,var(--tone-strong))] [--xy-edge-stroke-selected:var(--tone-strong)]',
        graphToneClasses[color],
        color === 'neutral'
          ? '[--xy-edge-stroke:var(--muted-foreground)]'
          : '[--xy-edge-stroke:var(--tone-strong)]',
      )}
    >
      {/* A wide translucent stroke of the same color under the path, like the ring of a node:
          light on hover, darker while selected. React Flow dashes and animates every path of an
          animated edge, so the halo turns both off. */}
      <path
        data-slot="edge-halo"
        d={path}
        fill="none"
        className="pointer-events-none animate-none stroke-transparent [stroke-width:6] [stroke-dasharray:none] [stroke-linecap:round] group-hover/edge:stroke-(--tone-strong)/20 flow-selected:stroke-(--tone-strong)/40"
      />
      <BaseEdge path={path} className={cn(lineStyles[variant], className)} {...props} />
    </g>
  )
}

export { Edge, type EdgeVariant }
