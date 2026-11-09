import { describe, expect, it } from 'vitest'

import { attentionLevels } from '@/modules/artifact/entities'
import { edgeLineStyles, edgeWeights } from '@/shared/components/ui/edge'
import { tones } from '@/shared/lib/tone'

import { chainEdgeLooks, chainNodeAttentionLooks } from '../item-trace.constants'

const levels = Object.keys(attentionLevels) as (keyof typeof chainEdgeLooks)[]

describe('chainEdgeLooks', () => {
  it('has a look for every level of attention', () => {
    expect(Object.keys(chainEdgeLooks).toSorted()).toEqual(levels.toSorted())
  })

  it('gives each level a look of its own, so a reader tells the links apart', () => {
    const looks = levels.map((level) => {
      const { variant, weight, color } = chainEdgeLooks[level]
      return `${variant}:${weight}:${color}`
    })

    expect(new Set(looks).size).toBe(levels.length)
  })

  it('draws only line styles, weights and colors that the design system knows', () => {
    for (const { variant, weight, color } of Object.values(chainEdgeLooks)) {
      expect(Object.keys(edgeLineStyles)).toContain(variant)
      expect(Object.keys(edgeWeights)).toContain(weight)
      expect(tones).toContain(color)
    }
  })

  it('draws no line thinner than the regular one, which stays easy to see', () => {
    for (const { weight } of Object.values(chainEdgeLooks)) {
      expect(weight).not.toBe('thin')
    }
    // A link that is sure, one that asks nothing and one to check, is thick; one that is open or
    // set aside is regular.
    expect(chainEdgeLooks.act.weight).toBe('strong')
    expect(chainEdgeLooks.none.weight).toBe('strong')
    expect(chainEdgeLooks.follow.weight).toBe('regular')
    expect(chainEdgeLooks.quiet.weight).toBe('regular')
  })
})

describe('chainNodeAttentionLooks', () => {
  it('has an entry for every level of attention, and a fill for the ones that ask something or are set aside', () => {
    expect(Object.keys(chainNodeAttentionLooks).toSorted()).toEqual(levels.toSorted())
    expect(chainNodeAttentionLooks.act).toEqual({ variant: 'soft', color: 'warning' })
    expect(chainNodeAttentionLooks.follow).toEqual({ variant: 'soft', color: 'primary' })
    expect(chainNodeAttentionLooks.quiet).toEqual({ variant: 'soft', color: 'muted' })
    expect(chainNodeAttentionLooks.none).toBeNull()
  })
})
