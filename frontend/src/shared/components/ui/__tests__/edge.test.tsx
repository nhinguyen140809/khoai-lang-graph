import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { tones } from '@/shared/lib/tone'
import { renderWithProviders } from '@/test/render'

import { Edge, edgeArrowSizes, edgeLineStyles, EdgeSample, edgeWeights } from '../edge'

function renderEdge(props: {
  variant?: 'solid' | 'dashed' | 'dotted'
  weight?: 'thin' | 'regular' | 'strong'
  color?: (typeof tones)[number]
  arrow?: boolean
}) {
  return renderWithProviders(
    <svg>
      <Edge id="edge" path="M 0 0 L 10 10" {...props} />
    </svg>,
  )
}

describe('Edge', () => {
  it('draws its line by the variant it is given, and names it on the element', () => {
    const { container } = renderEdge({ variant: 'dashed' })

    expect(container.querySelector('[data-slot="edge"]')).toHaveAttribute('data-variant', 'dashed')
  })

  it('draws the three weights of a line, and names the weight on the element', () => {
    for (const weight of ['thin', 'regular', 'strong'] as const) {
      const { container } = renderEdge({ weight })

      const edge = container.querySelector('[data-slot="edge"]')
      expect(edge).toHaveAttribute('data-weight', weight)
      const path = container.querySelector('.react-flow__edge-path')
      expect(path).toHaveClass(edgeWeights[weight])
    }
  })

  it('keeps the maps it draws from for a legend of the line looks', () => {
    expect(Object.keys(edgeLineStyles)).toEqual(['solid', 'dashed', 'dotted'])
    expect(Object.keys(edgeWeights)).toEqual(['thin', 'regular', 'strong'])
    expect(edgeWeights.strong).toContain('2.5px')
  })

  it('has no arrowhead unless it is asked for one', () => {
    const { container } = renderEdge({})

    expect(container.querySelector('marker')).toBeNull()
    expect(container.querySelector('.react-flow__edge-path')).not.toHaveAttribute('marker-end')
  })

  it('draws an arrowhead on every look of an edge: each line style, weight and color', () => {
    for (const variant of Object.keys(edgeLineStyles) as (keyof typeof edgeLineStyles)[]) {
      for (const weight of Object.keys(edgeWeights) as (keyof typeof edgeWeights)[]) {
        for (const color of tones) {
          const { container } = renderEdge({ variant, weight, color, arrow: true })

          const marker = container.querySelector('marker[data-slot="edge-arrow"]')
          // The head is sized by the weight and turns with the path, so it follows its tangent.
          expect(marker).toHaveAttribute('markerWidth', String(edgeArrowSizes[weight]))
          expect(marker).toHaveAttribute('orient', 'auto')
          expect(container.querySelector('.react-flow__edge-path')).toHaveAttribute(
            'marker-end',
            `url('#${marker?.id ?? ''}')`,
          )
          // The head is filled from the stroke variable the edge sets for its color.
          expect(marker?.querySelector('path')).toHaveClass('fill-(--xy-edge-stroke)')
          expect(container.querySelector('[data-slot="edge"]')).toHaveAttribute('data-color', color)
        }
      }
    }
  })

  it('gives each arrowhead an id of its own, so two canvases with an edge of one id do not share it', () => {
    const first = renderEdge({ arrow: true }).container.querySelector('marker')
    const second = renderEdge({ arrow: true }).container.querySelector('marker')

    expect(first?.id).toBeTruthy()
    expect(first?.id).not.toBe(second?.id)
  })

  it('keeps the sizes of the arrowhead, one for each weight and growing with it', () => {
    expect(Object.keys(edgeArrowSizes)).toEqual(Object.keys(edgeWeights))
    expect(edgeArrowSizes.thin).toBeLessThan(edgeArrowSizes.regular)
    expect(edgeArrowSizes.regular).toBeLessThan(edgeArrowSizes.strong)
  })
})

describe('EdgeSample', () => {
  it('draws a sample of every look of an edge, with the line style and the weight of the edge', () => {
    for (const variant of Object.keys(edgeLineStyles) as (keyof typeof edgeLineStyles)[]) {
      for (const weight of Object.keys(edgeWeights) as (keyof typeof edgeWeights)[]) {
        for (const color of tones) {
          const { container } = render(
            <EdgeSample variant={variant} weight={weight} color={color} />,
          )

          const sample = container.querySelector('[data-slot="edge-sample"]')
          expect(sample).toHaveAttribute('data-variant', variant)
          expect(sample).toHaveAttribute('data-weight', weight)
          expect(sample).toHaveAttribute('data-color', color)
          expect(sample?.querySelector('line')).toHaveClass(edgeWeights[weight])
        }
      }
    }
  })

  it('reads a neutral line muted and any other in the strong color of its tone, as the edge does', () => {
    const neutral = render(<EdgeSample color="neutral" />).container.firstElementChild
    const warning = render(<EdgeSample color="warning" />).container.firstElementChild

    expect(neutral).toHaveClass('text-muted-foreground')
    expect(warning).toHaveClass('text-(--tone-strong)')
  })
})
