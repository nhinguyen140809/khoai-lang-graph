import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Actor } from '@/shared/components/act'
import { advanceTimers, withFakeTimers } from '@/test/steps'

import { moods } from '../../face.types'
import { blinkEveryMs, blinkMs } from '../../motion/face-motion.constants'
import { eyesCloseMs, humanLooks } from '../human-face.constants'
import { eyesMotionOf } from '../human-face.utils'
import { HumanFace } from '../HumanFace'

function renderFace(props: Parameters<typeof HumanFace>[0]) {
  const { container } = render(<HumanFace {...props} />)
  const face = container.querySelector<HTMLElement>('[data-slot=human-face]')
  if (face === null) throw new Error('The face is not drawn')
  return face
}

describe('HumanFace', () => {
  it('is hidden from assistive technology, which reads the name beside it', () => {
    expect(renderFace({ seed: 'ada' })).toHaveAttribute('aria-hidden', 'true')
  })

  it('takes the size that it is given, as the face of an agent does', () => {
    expect(renderFace({ seed: 'ada', size: 'lg' })).toHaveClass('size-10')
  })

  it.each(moods)('draws the %s mood', (mood) => {
    expect(renderFace({ seed: 'ada', mood })).toHaveAttribute('data-mood', mood)
  })

  it('has a look for each mood, and asks nothing of the eyes that a mood does not need', () => {
    expect(Object.keys(humanLooks)).toEqual([...moods])
    expect(eyesMotionOf(humanLooks.idle).canBlink).toBe(true)
    expect(eyesMotionOf(humanLooks.sleeping).canBlink).toBe(false)
  })

  it('has the body, the pose and the head to move apart, one in the other', () => {
    const face = renderFace({ seed: 'ada' })

    expect(
      face.querySelector(
        '[data-slot=human-face-body] [data-slot=human-face-pose] [data-slot=human-face-head] [data-slot=human-face-picture]',
      ),
    ).not.toBeNull()
  })

  it('draws a picture with an eye on each side, whose iris the page can move', () => {
    const face = renderFace({ seed: 'ada' })

    expect(face.querySelector('svg')).not.toBeNull()
    expect(face.querySelector('use')).toBeNull()
    expect(face.querySelectorAll('.human-face-gaze')).toHaveLength(2)
    expect(
      face.querySelectorAll('.human-face-cover .human-face-blink .human-face-gaze'),
    ).toHaveLength(2)
  })

  it('draws the colors of the spec over those of its palette', () => {
    const plain = renderFace({ seed: 'ada' })
    const painted = renderFace({
      seed: 'ada',
      spec: { style: 'plain', palette: 'ink', parts: {}, colors: { skin: 'umber' } },
    })

    expect(plain.innerHTML).toMatch(/var\(--human-face-skin-(warm|umber)/)
    expect(painted.innerHTML).toContain('var(--human-face-skin-umber)')
    expect(painted.innerHTML).toContain('var(--human-face-hair-ink-black)')
  })

  it('keeps the background in place as the frame, a pastel that the seed or the spec picks', () => {
    const plain = renderFace({ seed: 'ada' })
    const named = renderFace({
      seed: 'ada',
      spec: { style: 'plain', parts: {}, colors: { background: 'mint' } },
    })

    expect(plain.getAttribute('style')).toContain('--human-face-background-')
    expect(named.getAttribute('style')).toContain('--human-face-background-mint')
    expect(named.querySelector('rect[fill]')).toBeNull()
  })

  it('is in a circle with its background by default, and with none when it is given no frame', () => {
    const framed = renderFace({ seed: 'ada' })
    const bare = renderFace({ seed: 'ada', frame: 'none' })

    expect(framed).toHaveAttribute('data-frame', 'circle')
    expect(framed).toHaveClass('rounded-full', 'overflow-hidden')
    expect(framed.getAttribute('style')).toContain('--human-face-background-')
    expect(bare).toHaveAttribute('data-frame', 'none')
    expect(bare).not.toHaveClass('rounded-full')
    expect(bare.getAttribute('style') ?? '').not.toContain('background')
    expect(bare.querySelector('svg')).not.toBeNull()
  })

  it('draws the parts of the spec, and the others from the seed', () => {
    const own = renderFace({ seed: 'ada' }).innerHTML
    const chosen = renderFace({
      seed: 'ada',
      spec: { style: 'plain', parts: { hair: 'mohawk' }, colors: {} },
    }).innerHTML

    expect(chosen).not.toBe(own)
  })

  it('draws other eyes of the family in the mood of surprise than in the mood of idleness', () => {
    const spec = { style: 'plain', parts: { eyes: 'round-open' }, colors: {} }
    const eyesOf = (mood: 'idle' | 'surprised') =>
      renderFace({ seed: 'ada', spec, mood }).querySelector('.human-face-blink')?.innerHTML

    expect(eyesOf('surprised')).not.toBe(eyesOf('idle'))
  })

  describe('a change of mood', () => {
    withFakeTimers()

    it('covers a change of mood: the eyes close first, and the new mood comes when they have', () => {
      const spec = { style: 'plain', parts: { eyes: 'round-open' }, colors: {} }
      const { container, rerender } = render(<HumanFace seed="ada" spec={spec} mood="idle" />)
      const picture = () => container.querySelector('[data-slot=human-face-picture]')
      const eyes = () =>
        [...container.querySelectorAll('.human-face-blink')].map((eye) => eye.innerHTML).join()
      const face = () => container.querySelector('[data-slot=human-face]')
      const before = eyes()

      rerender(<HumanFace seed="ada" spec={spec} mood="sleeping" />)

      expect(picture()).toHaveAttribute('data-covered')
      expect(eyes()).toBe(before)

      advanceTimers(eyesCloseMs)

      expect(picture()).not.toHaveAttribute('data-covered')
      expect(eyes()).not.toBe(before)
      expect(face()).toHaveAttribute('data-mood', 'sleeping')
    })
  })

  describe('blinking', () => {
    withFakeTimers()

    it('blinks now and then, as every face does', () => {
      const { container } = render(<HumanFace seed="ada" mood="idle" />)
      const isBlinking = () =>
        container.querySelector('[data-slot=human-face-picture]')?.hasAttribute('data-blinking') ===
        true

      expect(isBlinking()).toBe(false)
      advanceTimers(blinkEveryMs)
      expect(isBlinking()).toBe(true)
      advanceTimers(blinkMs)
      expect(isBlinking()).toBe(false)
    })
  })
})

describe('Actor with the face of a person', () => {
  it('draws the actor and the other agent of a work with it', () => {
    const { container } = render(
      <Actor seed="ada" acts={['interview']} partner="bob" face={HumanFace} />,
    )

    expect(container.querySelector('[data-slot=face]')).toBeNull()
    expect(container.querySelectorAll('[data-slot=human-face]')).toHaveLength(2)
  })
})
