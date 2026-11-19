import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Face } from '../Face'
import { type Mood, moods } from '../face.types'

function renderFace(props: Parameters<typeof Face>[0]) {
  const { container } = render(<Face {...props} />)
  const face = container.querySelector<HTMLElement>('[data-slot=face]')
  if (face === null) throw new Error('The face is not drawn')
  return face
}

describe('Face', () => {
  it('is hidden from assistive technology, which reads the name beside it', () => {
    expect(renderFace({ seed: 'analyst' })).toHaveAttribute('aria-hidden', 'true')
  })

  it('is the same for the same seed, and not the same for another', () => {
    const colors = (seed: string) => renderFace({ seed }).getAttribute('style')

    expect(colors('analyst')).toBe(colors('analyst'))
    expect(colors('analyst')).not.toBe(colors('validator'))
  })

  it.each(moods)('draws the %s mood', (mood) => {
    expect(renderFace({ seed: 'analyst', mood })).toHaveAttribute('data-mood', mood)
  })

  it('drifts its blobs only while it is at work', () => {
    expect(
      renderFace({ seed: 'analyst', mood: 'idle' }).querySelector('.animate-face-blob'),
    ).toBeNull()
    expect(
      renderFace({ seed: 'analyst', mood: 'working' }).querySelectorAll('.animate-face-blob'),
    ).toHaveLength(2)
  })

  it('draws a blob for the deep color and one for the second color', () => {
    const face = renderFace({ seed: 'analyst' })

    for (const part of ['core', 'second']) {
      expect(face.querySelector(`.face-blob-${part}`)).not.toBeNull()
    }
  })

  it('gives each blob a shape of its own, and uses every shape for some face', () => {
    const used = new Set<string>()
    for (let index = 0; index < 60; index += 1) {
      const face = renderFace({ seed: `agent-${String(index)}` })
      for (const part of ['core', 'second']) {
        const blob = face.querySelector(`.face-blob-${part}`)
        const shape = [...(blob?.classList ?? [])].find((name) => name.startsWith('face-shape-'))
        if (shape !== undefined) used.add(shape)
      }
    }

    expect(used).toEqual(
      new Set(['face-shape-round', 'face-shape-blob', 'face-shape-ellipse', 'face-shape-streak']),
    )
  })

  it('looks about as the mood says: round and round when it thinks, along a line when it works', () => {
    expect(
      renderFace({ seed: 'analyst', mood: 'thinking' }).querySelector('.animate-face-circle'),
    ).not.toBeNull()
    expect(
      renderFace({ seed: 'analyst', mood: 'working' }).querySelector('.animate-face-scan'),
    ).not.toBeNull()
    expect(
      renderFace({ seed: 'analyst', mood: 'happy' }).querySelector(
        '[class*="animate-face-wander"]',
      ),
    ).toBeNull()
  })

  it('shows the brows that the mood has, and fades them for a mood that has none', () => {
    const shown = (mood: Mood) =>
      [...renderFace({ seed: 'analyst', mood }).querySelectorAll<SVGElement>('.face-morph')].map(
        (part) => part.style.opacity,
      )

    expect(shown('idle')).toEqual(['0', '0'])
    expect(shown('happy')).toEqual(['0', '0'])
    expect(shown('worried')).toEqual(['1', '1'])
    expect(shown('thinking')).toEqual(['1', '1'])
  })

  it('has no mouth', () => {
    expect(
      renderFace({ seed: 'analyst', mood: 'happy' }).querySelectorAll('.face-morph'),
    ).toHaveLength(2)
  })

  it('blinks, except with closed eyes', () => {
    expect(
      renderFace({ seed: 'analyst', mood: 'idle' }).querySelector('.animate-face-blink'),
    ).not.toBeNull()
    expect(
      renderFace({ seed: 'analyst', mood: 'happy' }).querySelector('.animate-face-blink'),
    ).toBeNull()
  })

  it('takes the size that it is given', () => {
    expect(renderFace({ seed: 'analyst', size: 'lg' })).toHaveClass('size-10')
  })

  it('covers a change of mood: the eyes close first, and the new mood comes when they have', () => {
    const { container, rerender } = render(<Face seed="analyst" mood="idle" />)
    const squash = () => container.querySelector<SVGElement>('.face-squash')
    const browOpacity = () => container.querySelector<SVGElement>('.face-morph')?.style.opacity

    rerender(<Face seed="analyst" mood="worried" />)

    expect(squash()).toHaveClass('scale-y-10')
    expect(browOpacity()).toBe('0')

    fireEvent.transitionEnd(squash() ?? container)

    expect(squash()).not.toHaveClass('scale-y-10')
    expect(browOpacity()).toBe('1')
  })
})
