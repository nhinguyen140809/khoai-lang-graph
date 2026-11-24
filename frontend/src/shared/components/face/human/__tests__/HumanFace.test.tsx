import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Actor } from '@/shared/components/act'
import { advanceTimers, withFakeTimers } from '@/test/steps'

import { moods } from '../../face.types'
import { blinkEveryMs, blinkMs } from '../../motion/face-motion.constants'
import { humanLooks } from '../human-face.constants'
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

  it('has the head and the body to move apart: the body is the shoulders, the head turns on them', () => {
    const face = renderFace({ seed: 'ada' })

    expect(face.querySelector('[data-slot=human-face-body]')).not.toBeNull()
    expect(
      face.querySelector('[data-slot=human-face-pose] [data-slot=human-face-head]'),
    ).not.toBeNull()
  })

  it('shuts the eyes in the mood of sleep', () => {
    expect(
      renderFace({ seed: 'ada', mood: 'sleeping' }).querySelector('[data-shut]'),
    ).not.toBeNull()
    expect(renderFace({ seed: 'ada', mood: 'idle' }).querySelector('[data-shut]')).toBeNull()
  })

  it('covers a change of mood: the eyes close first, and the new mood comes when they have', () => {
    const { container, rerender } = render(<HumanFace seed="ada" mood="idle" />)
    const squash = () => container.querySelector<SVGElement>('.face-squash')
    const face = () => container.querySelector('[data-slot=human-face]')

    rerender(<HumanFace seed="ada" mood="sleeping" />)

    expect(squash()).toHaveClass('scale-y-10')
    expect(container.querySelector('[data-shut]')).toBeNull()

    fireEvent.transitionEnd(squash() ?? container)

    expect(squash()).not.toHaveClass('scale-y-10')
    expect(container.querySelector('[data-shut]')).not.toBeNull()
    expect(face()).toHaveAttribute('data-mood', 'sleeping')
  })

  describe('blinking', () => {
    withFakeTimers()

    it('blinks now and then, as every face does', () => {
      const { container } = render(<HumanFace seed="ada" mood="idle" />)
      const isBlinking = () => container.querySelector('.animate-face-blink') !== null

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
