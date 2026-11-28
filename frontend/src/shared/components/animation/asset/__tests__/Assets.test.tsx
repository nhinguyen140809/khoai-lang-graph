import { render } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it } from 'vitest'

import { nextFrame } from '@/test/steps'
import { type DrawnThing, itDrawsEachOf } from '@/test/suites'

import { BarsIcon } from '../../icon/BarsIcon'
import * as assets from '..'
import { Board } from '../boards/Board'
import { DocumentAsset } from '../boards/DocumentAsset'
import { LaptopAsset } from '../LaptopAsset'
import { PenAsset } from '../PenAsset'

// The assets named as boards end in Board, the rest as assets do in Asset.
const assetThings = Object.entries(assets).filter(
  ([name]) => name.endsWith('Asset') || name.endsWith('Board'),
) as readonly DrawnThing[]

const drawnBy = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path'), (path) => path.getAttribute('d')).join(' ')

describe('the assets that a clock draws', () => {
  itDrawsEachOf(assetThings)
})

describe('the board, drawn as an asset', () => {
  it('draws each of its shapes, and the marks it is given, not just the marks of a report', () => {
    const progress = motionValue(0)
    const sheet = render(<Board progress={progress} shape="sheet" />)
    const sheetDrawing = drawnBy(sheet.container)
    expect(sheetDrawing.length).toBeGreaterThan(0)

    const banner = render(<Board progress={progress} shape="banner" />)
    expect(drawnBy(banner.container)).not.toBe(sheetDrawing)

    const marked = render(
      <Board
        progress={progress}
        shape="square"
        marks={[{ rect: { from: [0.1, 0.1], to: [0.9, 0.9] }, face: 'b' }]}
      />,
    )
    expect(drawnBy(marked.container)).not.toBe(sheetDrawing)
  })

  it('carries an icon on its face, drawn within a frame that rides the plane of the board', () => {
    const progress = motionValue(0)
    const { container } = render(<Board progress={progress} shape="panel" icon={BarsIcon} />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2)
    expect(container.querySelector('g[transform^="matrix("]')).not.toBeNull()
  })
})

describe('the boards told as data', () => {
  it('stands still over its round when its marks say nothing of how they move', async () => {
    const still = motionValue(0)
    const document = render(<DocumentAsset progress={still} />)
    const documentAtStart = drawnBy(document.container)
    still.set(0.3)
    await nextFrame()
    expect(drawnBy(document.container)).toBe(documentAtStart)
  })
})

describe('the laptop, drawn as an asset', () => {
  it('keeps to the area that an icon keeps to over the whole swing of its screen', async () => {
    const progress = motionValue(0)
    const { container } = render(<LaptopAsset progress={progress} />)
    // The paths hold the drawing as it is before the frame scales and centers it, so the
    // transform of the frame is read and carried over each point before the point is checked.
    const [tx = 0, ty = 0, scale = 1] =
      (container.querySelector('g')?.getAttribute('transform') ?? '')
        .match(/-?[\d.]+/g)
        ?.map(Number) ?? []
    for (const point of [0, 0.25, 0.5, 0.75, 1]) {
      progress.set(point)
      await nextFrame()
      await nextFrame()
      const numbers = Array.from(container.querySelectorAll('path'), (path) =>
        (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g),
      )
        .flat()
        .map(Number)
      const placed = numbers.map((value, index) => value * scale + (index % 2 === 0 ? tx : ty))
      expect(Math.min(...placed)).toBeGreaterThanOrEqual(2)
      expect(Math.max(...placed)).toBeLessThanOrEqual(22)
    }
  })

  it('holds together over its round: the slopes of the tip stand on the flat sides of the rod', async () => {
    const progress = motionValue(0)
    const { container } = render(<PenAsset progress={progress} />)
    for (const point of [0, 0.125, 0.25, 0.5, 0.875]) {
      progress.set(point)
      await nextFrame()
      await nextFrame()
      // Every path of the pen closes within the same bounds: the tip never drifts off the rod.
      const numbers = Array.from(container.querySelectorAll('path'), (path) =>
        (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g),
      )
        .flat()
        .map(Number)
      const xs = numbers.filter((_, index) => index % 2 === 0)
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(20)
    }
  })

  it('holds a pen that does not write still, while the writing one moves on', async () => {
    const progress = motionValue(0)
    const { container } = render(<PenAsset progress={progress} writing={false} />)
    const atStart = drawnBy(container)
    progress.set(0.5)
    await nextFrame()
    expect(drawnBy(container)).toBe(atStart)

    const moving = render(<PenAsset progress={progress} />)
    const before = drawnBy(moving.container)
    progress.set(0.125)
    await nextFrame()
    await nextFrame()
    expect(drawnBy(moving.container)).not.toBe(before)
  })

  it('stands still over its round: the drawing at the quarter is the one at the start', () => {
    const progress = motionValue(0)
    const { container } = render(<LaptopAsset progress={progress} />)
    const atStart = drawnBy(container)

    progress.set(0.25)
    expect(drawnBy(container)).toBe(atStart)
  })

  it('turns with the view it is seen from, even while the clock stands still', async () => {
    const progress = motionValue(0.5)
    const { container, rerender } = render(
      <LaptopAsset progress={progress} view={{ yaw: 0, pitch: 22 }} />,
    )
    const fromAhead = drawnBy(container)

    rerender(<LaptopAsset progress={progress} view={{ yaw: 90, pitch: 22 }} />)
    await nextFrame()
    await nextFrame()
    expect(drawnBy(container)).not.toBe(fromAhead)
  })
})
