import { describe, expect, it } from 'vitest'

import { chartTones, graphToneClasses, graphTones, tones } from '../tone.constants'

describe('graphToneClasses', () => {
  it('has the classes of every tone and every chart color', () => {
    expect(graphTones).toEqual([...tones, ...chartTones])
    expect(Object.keys(graphToneClasses)).toEqual([...graphTones])
  })

  it('fills and strokes with a chart color, and keeps the text color for text', () => {
    for (const tone of chartTones) {
      expect(graphToneClasses[tone]).toContain(`[--tone:var(--${tone})]`)
      expect(graphToneClasses[tone]).toContain(`[--tone-foreground:var(--${tone}-foreground)]`)
      expect(graphToneClasses[tone]).toContain('[--tone-text:var(--foreground)]')
    }
  })
})
