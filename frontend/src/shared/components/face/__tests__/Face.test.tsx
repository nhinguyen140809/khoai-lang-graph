import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { advanceTimers, withFakeTimers } from '@/test/steps'

import { Face } from '../Face'
import { type Mood, moods } from '../face.types'
import { faceLooks, moodLooks, restAfterMs } from '../mood/face-mood.constants'
import { bodyLoops, poseLoops } from '../motion/face-loop.constants'
import { blinkEveryMs, blinkMs, gazeLooks, gazePaths } from '../motion/face-motion.constants'

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

  it('looks about as the mood says: a little when idle, not at all when happy, widely when it thinks, along a line when it works', () => {
    const gazeOf = (mood: Mood) => gazeLooks[moodLooks[mood].gaze]

    expect(gazeOf('idle').path).toBe('wander')
    expect(gazeOf('idle').gain).toBeLessThan(gazeOf('thinking').gain)
    expect(gazeOf('happy').path).toBeNull()
    expect(gazeOf('thinking').path).toBe('ponder')
    expect(gazeOf('working').path).toBe('scan')
    expect(gazeOf('waiting').head).toBeNull()
    expect(gazeOf('worried').head?.bow).toBeLessThan(0)
  })

  it('moves the whole face for the moods that do: it swells when surprised, turns around while it waits', () => {
    const loops = (mood: Mood) => {
      const { pose, body } = moodLooks[mood]
      return { pose: pose === undefined ? null : poseLoops[pose], body: bodyLoops[body ?? 'none'] }
    }

    expect(loops('surprised').body?.tracks.scale).toBeDefined()
    expect(loops('waiting').body?.tracks.rotateY).toBeDefined()
    expect(loops('waiting').body?.tracks.y).toBeUndefined()
    expect(loops('waiting').pose?.tracks.scale).toBeDefined()
    expect(loops('sleeping').body?.isMirrored).toBe(true)
    expect(loops('happy').pose?.tracks.rotate).toBeDefined()
    expect(loops('thinking').pose?.tracks.rotate).toBeDefined()
    expect(loops('idle')).toEqual({ pose: null, body: null })
  })

  it('draws two long eyes, and for thinking two round ones, the small one half the area of the large', () => {
    const eyes = (mood: Mood) =>
      renderFace({ seed: 'analyst', mood }).querySelectorAll('svg rect, svg circle')

    expect([...eyes('idle')].map((eye) => eye.tagName)).toEqual(['rect', 'rect'])
    const thinking = [...eyes('thinking')]
    expect(thinking.map((eye) => eye.tagName)).toEqual(['circle', 'circle'])
    const radius = (eye: Element | undefined) => Number(eye?.getAttribute('r'))
    expect(radius(thinking[1]) ** 2 / radius(thinking[0]) ** 2).toBeCloseTo(0.5, 1)
  })

  it('opens two round eyes wide when surprised', () => {
    const radii = [
      ...renderFace({ seed: 'analyst', mood: 'surprised' }).querySelectorAll('svg circle'),
    ].map((eye) => Number(eye.getAttribute('r')))

    expect(radii).toHaveLength(2)
    expect(radii[0]).toBeCloseTo(radii[1] ?? 0)
    expect(radii[0]).toBeGreaterThan(4)
  })

  it('shuts the eyes while asleep, with nothing that blinks', () => {
    const face = renderFace({ seed: 'analyst', mood: 'sleeping' })

    expect(face.querySelectorAll('svg path')).toHaveLength(2)
    expect(face.querySelector('.animate-face-blink')).toBeNull()
  })

  it('leans the eyes of a worried face toward each other', () => {
    const tilts = [
      ...renderFace({ seed: 'analyst', mood: 'worried' }).querySelectorAll<SVGElement>('svg g g g'),
    ]
      .map((eye) => eye.style.rotate)
      .filter((tilt) => tilt !== '')

    expect(tilts).toEqual(['12deg', '-12deg'])
  })

  it('gives the two eyes of a thinking face lives of their own: one swells, the other squints', () => {
    const lives = (mood: Mood) =>
      [...renderFace({ seed: 'analyst', mood }).querySelectorAll('svg g')].map((part) =>
        [...part.classList].find((name) => name.startsWith('animate-face-eye-')),
      )

    expect(lives('thinking').filter((name) => name !== undefined)).toEqual([
      'animate-face-eye-breathe',
      'animate-face-eye-squint',
    ])
    expect(lives('idle').filter((name) => name !== undefined)).toEqual([])
  })

  it('has the outline of its shape', () => {
    const shapes = new Set<string>()
    for (let index = 0; index < 60; index += 1) {
      const face = renderFace({ seed: `agent-${String(index)}` })
      for (const name of face.querySelector('.face-blur')?.classList ?? []) {
        if (name.startsWith('face-silhouette-')) shapes.add(name)
      }
    }

    expect(shapes.size).toBeGreaterThan(3)
  })

  it('shows a part of its look that is overridden instead of the one of its mood', () => {
    const face = renderFace({ seed: 'analyst', mood: 'idle', override: { body: 'bounce' } })

    expect(face.querySelector('[data-body]')).toHaveAttribute('data-body', 'bounce')
    expect(
      renderFace({ seed: 'analyst', mood: 'idle' }).querySelector('[data-body]'),
    ).toHaveAttribute('data-body', 'none')
  })

  it('takes the size that it is given', () => {
    expect(renderFace({ seed: 'analyst', size: 'lg' })).toHaveClass('size-10')
  })

  it('covers a change of mood: the eyes close first, and the new mood comes when they have', () => {
    const { container, rerender } = render(<Face seed="analyst" mood="idle" />)
    const squash = () => container.querySelector<SVGElement>('.face-squash')
    const eyeTags = () =>
      [...container.querySelectorAll('svg rect, svg circle')].map((eye) => eye.tagName)

    rerender(<Face seed="analyst" mood="thinking" />)

    expect(squash()).toHaveClass('scale-y-10')
    expect(eyeTags()).toEqual(['rect', 'rect'])

    fireEvent.transitionEnd(squash() ?? container)

    expect(squash()).not.toHaveClass('scale-y-10')
    expect(eyeTags()).toEqual(['circle', 'circle'])
  })

  describe('blinking', () => {
    withFakeTimers()

    it('blinks now and then, and has its eyes open between two blinks', () => {
      const { container } = render(<Face seed="analyst" mood="idle" />)
      const isBlinking = () => container.querySelector('.animate-face-blink') !== null

      expect(isBlinking()).toBe(false)
      advanceTimers(blinkEveryMs)
      expect(isBlinking()).toBe(true)
      advanceTimers(blinkMs)
      expect(isBlinking()).toBe(false)
    })

    it('does not blink with closed eyes', () => {
      const { container } = render(<Face seed="analyst" mood="happy" />)

      advanceTimers(blinkEveryMs * 3)

      expect(container.querySelector('.animate-face-blink')).toBeNull()
    })
  })

  describe('when it is idle for long', () => {
    withFakeTimers()

    it('comes to rest, and is busy again as soon as its mood is another', () => {
      const { container, rerender } = render(<Face seed="analyst" mood="idle" />)
      const face = () => container.querySelector('[data-slot=face]')

      expect(face()).not.toHaveAttribute('data-resting')
      advanceTimers(restAfterMs)
      expect(face()).toHaveAttribute('data-resting')

      rerender(<Face seed="analyst" mood="thinking" />)
      expect(face()).not.toHaveAttribute('data-resting')
    })

    it('comes to rest when it is happy, and takes the time again when its mood changes', () => {
      const { container, rerender } = render(<Face seed="analyst" mood="happy" />)
      const face = () => container.querySelector('[data-slot=face]')

      advanceTimers(restAfterMs)
      expect(face()).toHaveAttribute('data-resting')
      expect(faceLooks['resting-happy'].pose).toBeUndefined()

      rerender(<Face seed="analyst" mood="idle" />)
      expect(face()).not.toHaveAttribute('data-resting')
      advanceTimers(restAfterMs - 1)
      expect(face()).not.toHaveAttribute('data-resting')
    })

    it('does not come to rest while it is busy', () => {
      const { container } = render(<Face seed="analyst" mood="working" />)

      advanceTimers(restAfterMs * 2)

      expect(container.querySelector('[data-slot=face]')).not.toHaveAttribute('data-resting')
    })

    it('looks to one side along no path, so that nothing runs', () => {
      expect(gazeLooks[faceLooks['resting-idle'].gaze].path).toBe('toward')
      expect(gazePaths.toward.durationMs).toBe(0)
    })
  })
})
