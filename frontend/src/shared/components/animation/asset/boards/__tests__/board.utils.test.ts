import { describe, expect, it } from 'vitest'

import type { AssetPlate } from '../../asset.types'
import type { BoardMark } from '../board.types'
import { boardPlatesOf } from '../board.utils'

/** The extents of a mark, as its corners came out of the plates. */
const extentsOf = (plate: AssetPlate) => ({
  x0: Math.min(...plate.corners.map((corner) => corner.x)),
  x1: Math.max(...plate.corners.map((corner) => corner.x)),
  y0: Math.min(...plate.corners.map((corner) => corner.y)),
  y1: Math.max(...plate.corners.map((corner) => corner.y)),
})

/** The mark of a rectangle on the panel, drawn at a point of the clock; the test fails if it is not drawn. */
function drawn(move: BoardMark['move'], progress = 0): AssetPlate {
  const plate = boardPlatesOf(
    'panel',
    [{ rect: { from: [0.2, 0.2], to: [0.8, 0.8] }, face: 'a', move }],
    progress,
  )[1]
  if (plate === undefined) throw new Error('The mark is not drawn')
  return plate
}

// The panel: 13.5 wide, 8.5 tall, leaning back 12 degrees, so far across a mark runs times 13.5
// and so far up it runs times 8.5 laid on the leaned plane.
const upOnPanel = (up: number) => up * 8.5 * Math.cos((12 * Math.PI) / 180)

describe('the moving marks of a board', () => {
  it('slides a mark to and fro along its row, as far as the reach, in its own time', () => {
    const rest = drawn({ slide: { reach: 0.1, phase: 0 } })
    expect(extentsOf(rest).x1 - extentsOf(rest).x0).toBeCloseTo(0.6 * 13.5)
    // A quarter of the round in, it is as far to the right as it goes; three quarters in, as far to the left.
    const right = drawn({ slide: { reach: 0.1, phase: 0 } }, 0.25)
    expect(extentsOf(right).x1 - extentsOf(rest).x1).toBeCloseTo(0.1 * 13.5)
    const left = drawn({ slide: { reach: 0.1, phase: 0 } }, 0.75)
    expect(extentsOf(left).x1 - extentsOf(rest).x1).toBeCloseTo(-0.1 * 13.5)
  })

  it('grows a mark from its foot and from its head, never shorter than three fifths', () => {
    const full = drawn({ grow: { phase: 0, from: 'foot' } }, 0.5)
    expect(extentsOf(full).y1 - extentsOf(full).y0).toBeCloseTo(upOnPanel(0.6))
    const short = drawn({ grow: { phase: 0, from: 'foot' } })
    expect(extentsOf(short).y1 - extentsOf(short).y0).toBeCloseTo(upOnPanel(0.6) * 0.6)
    // From the foot, the foot stands still and the head comes down to it; from the head, the other way.
    expect(extentsOf(short).y0).toBeCloseTo(extentsOf(full).y0)
    const fromHead = drawn({ grow: { phase: 0, from: 'head' } })
    expect(extentsOf(fromHead).y1).toBeCloseTo(extentsOf(full).y1)
  })

  it('draws a line in from its start to its end over a stretch of the round', () => {
    const line: BoardMark = {
      line: {
        points: [
          [0.1, 0.5],
          [0.9, 0.5],
        ],
        width: 0.1,
      },
      face: 'a',
      move: { reveal: { from: 0, to: 0.5 } },
    }
    const half = boardPlatesOf('panel', [line], 0.25)[1]
    const whole = boardPlatesOf('panel', [line], 0.5)[1]
    if (half === undefined || whole === undefined) throw new Error('The line is not drawn')
    // The line runs along the board, so its width runs up it and takes nothing from how far across it is.
    expect(extentsOf(half).x1 - extentsOf(half).x0).toBeCloseTo(0.4 * 13.5, 1)
    expect(extentsOf(whole).x1 - extentsOf(whole).x0).toBeCloseTo(0.8 * 13.5, 1)
  })

  it('shows a mark over a stretch of the round, and lights one up to dim again after', () => {
    expect(drawn({ appear: { from: 0, to: 0.5 } }, 0.25).opacity).toBeCloseTo(0.5)
    expect(drawn({ light: { from: 0, to: 0.5 } }, 0.25).opacity).toBeCloseTo(1)
    // Lit up at its stretch, dimmed again after it, never below a third.
    expect(drawn({ light: { from: 0, to: 0.5 } }, 1).opacity).toBeCloseTo(0.35)
  })

  it('drifts a mark up the board over the round, seen whole between the edges and fading before them', () => {
    const drifting = { cycle: { by: 0.3, within: { bottom: 0.1, top: 0.9, fade: 0.1 } } }
    // Whole in the middle of the edges, at its start.
    expect(drawn(drifting).opacity).toBeCloseTo(1)
    const moved = drawn(drifting, 0.5)
    expect(extentsOf(moved).y0 - extentsOf(drawn(drifting)).y0).toBeCloseTo(upOnPanel(0.15))
    // At the top edge it has faded to nothing.
    const gone = drawn({ cycle: { by: 1, within: { bottom: 0.1, top: 0.9, fade: 0.1 } } }, 0.5)
    expect(gone.opacity).toBeCloseTo(0)
  })
})
