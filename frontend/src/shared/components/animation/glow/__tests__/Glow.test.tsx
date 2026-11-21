import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Glow } from '../Glow'

function renderGlow(props: Parameters<typeof Glow>[0] = {}) {
  const { container } = render(<Glow {...props} />)
  const outer = container.querySelector<HTMLElement>('[data-slot=glow]')
  const inner = outer?.firstElementChild as HTMLElement | null
  if (outer === null || inner === null) throw new Error('The glow is not drawn')
  return { outer, inner }
}

describe('Glow', () => {
  it('is hidden from assistive technology and from the pointer', () => {
    const { outer } = renderGlow()

    expect(outer).toHaveAttribute('aria-hidden', 'true')
    expect(outer).toHaveClass('pointer-events-none')
  })

  it('takes its color, its strength, its shape and its size', () => {
    const { inner } = renderGlow({ color: 'secondary', strength: 20, shape: 'ellipse', size: 'lg' })

    expect(inner.className).toContain('--tone:var(--secondary)')
    expect(inner.style.opacity).toBe('0.2')
    expect(inner).toHaveClass('h-96', 'w-160')
  })

  it('comes in by its entrance and moves by its motion, each for the time it is given', () => {
    const { outer, inner } = renderGlow({
      entrance: 'grow',
      entranceDuration: 900,
      motion: 'pulse',
      motionDuration: 4000,
      motionDelay: -2000,
    })

    expect(outer).toHaveClass('zoom-in-75')
    expect(outer.style.animationDuration).toBe('900ms')
    expect(inner).toHaveClass('animate-glow-pulse')
    expect(inner.style.animationDuration).toBe('4000ms')
    expect(inner.style.animationDelay).toBe('-2000ms')
  })

  it('stands still with the motion and the entrance of none', () => {
    const { outer, inner } = renderGlow({ entrance: 'none', motion: 'none' })

    expect(outer.className).not.toContain('animate-in')
    expect(inner.className).not.toContain('animate-glow')
  })

  it('has an uneven blob shape, and takes a width, a height and a turn of its own', () => {
    const { inner } = renderGlow({ shape: 'blob', width: '40rem', height: '12rem', rotate: -20 })

    expect(inner).toHaveClass('rounded-blob')
    expect(inner.className).not.toContain('h-80')
    expect(inner.style.width).toBe('40rem')
    expect(inner.style.height).toBe('12rem')
    expect(inner.style.rotate).toBe('-20deg')
  })

  it('is as soft as it goes unless it is asked to be less blurred', () => {
    expect(renderGlow().inner).toHaveClass('blur-3xl')
    expect(renderGlow({ blur: 'sm' }).inner).toHaveClass('blur-xl')
  })
})
