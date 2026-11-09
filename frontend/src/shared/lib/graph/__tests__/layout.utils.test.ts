import { describe, expect, it } from 'vitest'

import { layoutLayered } from '../layout.utils'

describe('layoutLayered', () => {
  it('places the nodes of a chain in layers, the first layer where the direction starts', async () => {
    const layout = await layoutLayered(
      {
        nodes: [{ id: 'story' }, { id: 'requirement' }, { id: 'need' }],
        edges: [
          { source: 'story', target: 'requirement' },
          { source: 'requirement', target: 'need' },
        ],
      },
      { width: 200, height: 56, direction: 'LEFT' },
    )

    expect(Object.keys(layout.positions).sort()).toEqual(['need', 'requirement', 'story'])
    // The layers read right to left: the story at the right, the need at the left.
    expect(layout.positions.story?.x).toBeGreaterThan(layout.positions.need?.x ?? 0)
    // No two nodes of one layer sit at the same place.
    expect(layout.positions.story?.x).not.toBe(layout.positions.requirement?.x)
  })

  it('leaves the room between two layers that it is asked for', async () => {
    const graph = {
      nodes: [{ id: 'story' }, { id: 'need' }],
      edges: [{ source: 'story', target: 'need' }],
    }
    const distanceOf = async (layerSpacing?: number) => {
      const { positions } = await layoutLayered(graph, {
        width: 200,
        height: 56,
        direction: 'LEFT',
        layerSpacing,
      })
      return (positions.story?.x ?? 0) - (positions.need?.x ?? 0) - 200
    }

    expect(await distanceOf()).toBe(96)
    expect(await distanceOf(160)).toBe(160)
  })

  it('places a lone node at the origin', async () => {
    const layout = await layoutLayered(
      { nodes: [{ id: 'alone' }], edges: [] },
      { width: 200, height: 56, direction: 'DOWN' },
    )

    expect(layout.positions.alone).toBeDefined()
  })

  it('leaves out an edge whose end is not among the nodes', async () => {
    const layout = await layoutLayered(
      { nodes: [{ id: 'alone' }], edges: [{ source: 'alone', target: 'gone' }] },
      { width: 200, height: 56, direction: 'DOWN' },
    )

    expect(Object.keys(layout.positions)).toEqual(['alone'])
    expect(layout.positions.alone?.x).toBeTypeOf('number')
    expect(layout.positions.alone?.y).toBeTypeOf('number')
  })
})
