import { describe, expect, it, vi } from 'vitest'

import { attentionLevels, reviewStatuses } from '@/modules/artifact/entities'

import { chainColumnsOf, chainFlowEdges, chainFlowNodes, chainNodeProps } from '../item-trace.utils'
import { chainEdgeOf, chainNodeOf, nodeLookCases } from './item-trace.utils.data'

type Status = (typeof reviewStatuses)[number]
type Level = keyof typeof attentionLevels

const levels = Object.keys(attentionLevels) as Level[]

/** The fill and the color of a node that is not the item of the page, as one word. */
function lookOf(status: Status, attention: Level): string {
  const { variant, color } = chainNodeProps({ status, attention, isSubject: false })
  return `${variant ?? ''}:${color ?? ''}`
}

describe('chainNodeProps', () => {
  it.each(nodeLookCases)(
    'paints a $status item at level $attention as $variant $color',
    ({ status, attention, variant, color, isFaded }) => {
      expect(chainNodeProps({ status, attention, isSubject: false })).toEqual({
        variant,
        color,
        isFaded,
        'data-focus': undefined,
        'aria-current': undefined,
      })
    },
  )

  it('has a case for every review status at every level of attention', () => {
    const covered = nodeLookCases.map(({ status, attention }) => `${status}:${attention}`)

    expect(covered.toSorted()).toEqual(
      reviewStatuses.flatMap((status) => levels.map((level) => `${status}:${level}`)).toSorted(),
    )
  })

  it('paints the item of the page as the solid yellow node, whatever its status and what it asks', () => {
    for (const status of reviewStatuses) {
      for (const attention of levels) {
        expect(chainNodeProps({ status, attention, isSubject: true })).toEqual({
          variant: 'solid',
          color: 'chart',
          isFaded: false,
          'data-focus': '',
          'aria-current': 'page',
        })
      }
    }
  })

  it('gives the solid fill to the item of the page and to an approved item that asks nothing, and to no other', () => {
    for (const { status, attention } of nodeLookCases) {
      const props = chainNodeProps({ status, attention, isSubject: false })
      const isApprovedAtRest = status === 'approved' && attention === 'none'
      expect(props.variant === 'solid').toBe(isApprovedAtRest)
      // Only the item of the page carries the data that rings it and marks it as the page.
      expect(props['data-focus']).toBeUndefined()
      expect(props['aria-current']).toBeUndefined()
    }
  })

  it('tells a draft from an approved item when neither asks anything', () => {
    expect(lookOf('draft', 'none')).not.toBe(lookOf('approved', 'none'))
    // An item that asks something looks the same whatever its review status.
    for (const level of ['act', 'follow'] as const) {
      expect(new Set(reviewStatuses.map((status) => lookOf(status, level))).size).toBe(1)
    }
  })

  it('sets a rejected or replaced item aside, as an item of the quiet level', () => {
    for (const status of ['rejected', 'superseded'] as const) {
      expect(chainNodeProps({ status, attention: 'none', isSubject: false })).toEqual(
        chainNodeProps({ status, attention: 'quiet', isSubject: false }),
      )
    }
  })

  it('gives every kind of node a look of its own: one for each level that asks something, the quiet level, a draft, an approved item and the item of the page', () => {
    const subject = chainNodeProps({ status: 'draft', attention: 'none', isSubject: true })
    const looks = [
      lookOf('draft', 'act'),
      lookOf('draft', 'follow'),
      lookOf('draft', 'quiet'),
      lookOf('draft', 'none'),
      lookOf('approved', 'none'),
      `${subject.variant ?? ''}:${subject.color ?? ''}`,
    ]

    expect(new Set(looks).size).toBe(6)
  })

  it('uses no color that reads as a verdict, so nothing shouts without a reason', () => {
    for (const { status, attention } of nodeLookCases) {
      const { color } = chainNodeProps({ status, attention, isSubject: false })
      expect(['success', 'destructive']).not.toContain(color)
    }
  })

  it('fades the items that are set aside, and no other', () => {
    for (const { status, attention } of nodeLookCases) {
      const { color, isFaded } = chainNodeProps({ status, attention, isSubject: false })
      expect(isFaded).toBe(color === 'muted')
    }
  })
})

describe('chainFlowNodes', () => {
  it('places each node where the layout puts it', () => {
    const nodes = chainFlowNodes([chainNodeOf('a'), chainNodeOf('b')], {
      a: { x: 10, y: 20 },
      b: { x: 30, y: 40 },
    })

    expect(nodes.map(({ id, position }) => [id, position])).toEqual([
      ['a', { x: 10, y: 20 }],
      ['b', { x: 30, y: 40 }],
    ])
  })

  it('puts a node the layout did not place at the origin', () => {
    const [node] = chainFlowNodes([chainNodeOf('a')], {})

    expect(node?.position).toEqual({ x: 0, y: 0 })
  })
})

describe('chainFlowEdges', () => {
  it('marks only the edge of the chosen link, and chooses it through its own id', () => {
    const onSelect = vi.fn()
    const edges = chainFlowEdges([chainEdgeOf('e1', 'a', 'b'), chainEdgeOf('e2', 'b', 'c')], {
      selectedLinkId: 'e2',
      onSelect,
    })

    expect(edges.map(({ id, data }) => [id, data?.isSelected])).toEqual([
      ['e1', false],
      ['e2', true],
    ])
    edges[0]?.data?.onSelect()
    expect(onSelect).toHaveBeenCalledWith('e1')
  })

  it('marks no edge while no link is chosen', () => {
    const edges = chainFlowEdges([chainEdgeOf('e1', 'a', 'b')], {
      selectedLinkId: null,
      onSelect: vi.fn(),
    })

    expect(edges[0]?.data?.isSelected).toBe(false)
  })
})

describe('chainColumnsOf', () => {
  it('groups the nodes that share a left edge, from left to right, with the top of each column', () => {
    const columns = chainColumnsOf(
      [chainNodeOf('a', 'Interview'), chainNodeOf('b', 'Need'), chainNodeOf('c', 'Need')],
      { a: { x: 0, y: 60 }, b: { x: 300, y: 10 }, c: { x: 300, y: 90 } },
    )

    expect(columns).toEqual([
      { x: 0, y: 60, kinds: ['Interview'] },
      { x: 300, y: 10, kinds: ['Need'] },
    ])
  })

  it('names each kind of a column once, in the order it first appears', () => {
    const columns = chainColumnsOf(
      [chainNodeOf('a', 'Need'), chainNodeOf('b', 'Rule'), chainNodeOf('c', 'Need')],
      { a: { x: 0, y: 0 }, b: { x: 0, y: 90 }, c: { x: 0, y: 180 } },
    )

    expect(columns[0]?.kinds).toEqual(['Need', 'Rule'])
  })

  it('leaves out a node the layout did not place', () => {
    expect(chainColumnsOf([chainNodeOf('a')], {})).toEqual([])
  })
})
