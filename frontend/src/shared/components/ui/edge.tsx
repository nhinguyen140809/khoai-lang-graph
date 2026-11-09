import { BaseEdge, type BaseEdgeProps } from '@xyflow/react'
import { cn } from 'cn'
import { useId } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

/** The line styles of an edge, by variant. */
export const edgeLineStyles = {
  solid: '',
  dashed: '[stroke-dasharray:6_4]',
  dotted: '[stroke-dasharray:1_2]',
} as const

/** The stroke widths of an edge, by weight. */
export const edgeWeights = {
  thin: '[--xy-edge-stroke-width:1px]',
  regular: '[--xy-edge-stroke-width:1.5px]',
  strong: '[--xy-edge-stroke-width:2.5px]',
} as const

/** The size of the arrowhead of an edge, in pixels, by weight: a heavier line takes a larger head. */
export const edgeArrowSizes = {
  thin: 8,
  regular: 10,
  strong: 13,
} as const

type EdgeVariant = keyof typeof edgeLineStyles
type EdgeWeight = keyof typeof edgeWeights

/**
 * An edge path: `variant` is the line style, `weight` the stroke width and `color` the meaning.
 * React Flow draws the path and the label with the --xy-edge-* variables set here, and switches
 * to the selected stroke itself. A neutral edge is muted at rest and takes the text color while
 * selected. With `arrow`, the end of the path takes an arrowhead in the color of the line, drawn
 * as a marker that turns with the tangent of the path there, so it points along the edge whatever
 * the line style and the weight.
 */
function Edge({
  path,
  variant = 'solid',
  weight = 'regular',
  color = 'neutral',
  arrow = false,
  className,
  ...props
}: Omit<BaseEdgeProps, 'color'> & {
  variant?: EdgeVariant | undefined
  weight?: EdgeWeight | undefined
  color?: Tone | undefined
  /** Whether the end of the edge has an arrowhead; none when absent. */
  arrow?: boolean | undefined
}) {
  // Two canvases on a page may hold edges of the same id, so the marker has an id of its own.
  const markerId = `${useId()}-arrow`
  const size = edgeArrowSizes[weight]

  return (
    <g
      data-slot="edge"
      data-variant={variant}
      data-weight={weight}
      data-color={color}
      className={cn(
        'group/edge [--xy-edge-label-color:var(--tone-strong)] [--xy-edge-stroke-selected:var(--tone-strong)]',
        toneClasses[color],
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
      {arrow && (
        <defs>
          <marker
            id={markerId}
            data-slot="edge-arrow"
            viewBox="0 0 10 10"
            refX={10}
            refY={5}
            markerWidth={size}
            markerHeight={size}
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            {/* The tip sits at the end of the path; the back is notched, so the head reads as an
                arrow and not as a flat triangle. It takes the color of the stroke, also selected. */}
            <path
              d="M 0 0 L 10 5 L 0 10 L 2.5 5 Z"
              className="fill-(--xy-edge-stroke) flow-selected:fill-(--xy-edge-stroke-selected)"
            />
          </marker>
        </defs>
      )}
      <BaseEdge
        path={path}
        className={cn(edgeLineStyles[variant], edgeWeights[weight], className)}
        {...props}
        {...(arrow ? { markerEnd: `url('#${markerId}')` } : {})}
      />
    </g>
  )
}

/**
 * A short sample of the line of an edge, drawn with the same line styles, weights and colors as
 * the edge, for a legend: a neutral line reads muted, as the neutral edge does, and any other
 * color reads in the strong color of its tone.
 */
function EdgeSample({
  variant = 'solid',
  weight = 'regular',
  color = 'neutral',
  className,
}: {
  variant?: EdgeVariant | undefined
  weight?: EdgeWeight | undefined
  color?: Tone | undefined
  className?: string | undefined
}) {
  return (
    <svg
      aria-hidden
      data-slot="edge-sample"
      data-variant={variant}
      data-weight={weight}
      data-color={color}
      className={cn(
        'h-4 w-10 shrink-0',
        toneClasses[color],
        color === 'neutral' ? 'text-muted-foreground' : 'text-(--tone-strong)',
        className,
      )}
    >
      <line
        x1="0"
        y1="8"
        x2="40"
        y2="8"
        className={cn(edgeLineStyles[variant], edgeWeights[weight])}
        style={{ strokeWidth: 'var(--xy-edge-stroke-width, 1.5px)' }}
        stroke="currentColor"
      />
    </svg>
  )
}

export { Edge, EdgeSample, type EdgeVariant, type EdgeWeight }
