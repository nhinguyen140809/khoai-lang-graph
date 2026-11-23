import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FaceProps } from '@/shared/components/face'
import { advanceTimers, withFakeTimers } from '@/test/steps'

import { actFadeMs } from '../act.constants'
import { Actor } from '../Actor'

function renderActor(props: Partial<Parameters<typeof Actor>[0]> = {}) {
  const { container } = render(<Actor seed="analyst" acts={['write']} {...props} />)
  const actor = container.querySelector<HTMLElement>('[data-slot=actor]')
  if (actor === null) throw new Error('The actor is not drawn')
  return actor
}

describe('Actor', () => {
  withFakeTimers()

  afterEach(() => {
    vi.useRealTimers()
  })

  it('draws the face with the mood it is given', () => {
    const actor = renderActor({ mood: 'waiting' })

    expect(actor.querySelector('[data-slot=face]')).toHaveAttribute('data-mood', 'waiting')
  })

  it('draws the things of its act around the face, each in its slot', () => {
    const actor = renderActor({ acts: ['write'] })

    expect(actor).toHaveAttribute('data-act', 'write')
    expect(actor.querySelectorAll('svg')).toHaveLength(2 + 1)
  })

  it('leaves out a thing that stands in a slot that may not be used', () => {
    const actor = renderActor({ acts: ['write'], slots: ['bottom'] })

    expect(actor.querySelectorAll('svg')).toHaveLength(1 + 1)
  })

  it('draws nothing around the face for a key that no act is drawn for', () => {
    const actor = renderActor({ acts: ['nothing'] })

    expect(actor).not.toHaveAttribute('data-act')
    expect(actor.querySelectorAll('svg')).toHaveLength(1)
  })

  it('changes to another act after the one that goes, not at once', () => {
    const { container, rerender } = render(<Actor seed="analyst" acts={['write']} />)
    const actor = () => container.querySelector('[data-slot=actor]')

    rerender(<Actor seed="analyst" acts={['typing']} />)
    expect(actor()).toHaveAttribute('data-act', 'write')

    advanceTimers(actFadeMs.out)
    expect(actor()).toHaveAttribute('data-act', 'typing')
  })
})

describe('Actor mood and size', () => {
  it('has the mood of its act, and the mood that it is given instead when it is given one', () => {
    expect(renderActor({ acts: ['analyze'] }).querySelector('[data-slot=face]')).toHaveAttribute(
      'data-mood',
      'thinking',
    )
    expect(
      renderActor({ acts: ['analyze'], mood: 'waiting' }).querySelector('[data-slot=face]'),
    ).toHaveAttribute('data-mood', 'waiting')
  })

  it('lets the act have its mood when it is given the mood of work in general', () => {
    expect(
      renderActor({ acts: ['analyze'], mood: 'working' }).querySelector('[data-slot=face]'),
    ).toHaveAttribute('data-mood', 'thinking')
  })

  it('is the size of the largest face by default, and larger when it asks', () => {
    expect(renderActor().querySelector('[data-slot=face]')).toHaveClass('size-10')
    expect(renderActor({ size: '2xl' }).querySelector('[data-slot=face]')).toHaveClass('size-20')
  })

  it('puts a ring of copies of a thing round the face: each copy at a point of its own', () => {
    const actor = renderActor({ acts: ['summarize'] })

    expect(actor.querySelectorAll('svg')).toHaveLength(1 + 3 + 3)
  })
})

describe('Actor things', () => {
  it('draws words that show one after another, for an act that counts', () => {
    const actor = renderActor({ acts: ['calculate'] })

    expect(actor).toHaveTextContent('12x4=48')
    expect(actor).toHaveTextContent('%')
  })

  it('draws a single question mark for an act that asks, not a flight of them', () => {
    const actor = renderActor({ acts: ['question'] })

    expect(actor.textContent).toBe('?')
  })

  it('draws the other agent of an interview when it is given one, and leaves it out when it is not', () => {
    const withPartner = renderActor({ acts: ['interview'], partner: 'persona:Minh' })
    const alone = renderActor({ acts: ['interview'] })

    expect(withPartner.querySelectorAll('[data-slot=face]')).toHaveLength(2)
    expect(alone.querySelectorAll('[data-slot=face]')).toHaveLength(1)
  })

  it('gives the other agent a face of its own, by what it comes from', () => {
    const style = (partner: string) =>
      renderActor({ acts: ['interview'], partner })
        .querySelectorAll('[data-slot=face]')[1]
        ?.getAttribute('style')

    expect(style('persona:Minh')).toBe(style('persona:Minh'))
    expect(style('persona:Minh')).not.toBe(style('persona:Lan'))
  })

  it('has a face of the same size for the other agent', () => {
    const faces = renderActor({
      acts: ['interview'],
      partner: 'persona:Minh',
      size: 'xl',
    }).querySelectorAll('[data-slot=face]')

    expect(faces[0]).toHaveClass('size-14')
    expect(faces[1]).toHaveClass('size-14')
  })
})

describe('Actor frame', () => {
  const frameOf = (actor: HTMLElement) => actor.closest<HTMLElement>('[data-slot=actor-frame]')

  it('holds the actor in a frame of the size of its face, which the place styles', () => {
    const lg = frameOf(renderActor({ className: 'absolute top-0' }))
    const xl = frameOf(renderActor({ size: 'xl' }))

    expect(lg).toHaveClass('actor-frame', 'actor-frame-lg', 'absolute')
    expect(xl).toHaveClass('actor-frame-xl')
  })

  it('keeps the room of the other agent in the frame only when it is given one', () => {
    expect(frameOf(renderActor({ acts: ['interview'], partner: 'persona:Minh' }))).toHaveAttribute(
      'data-partner',
      'true',
    )
    expect(frameOf(renderActor({ acts: ['interview'] }))).toHaveAttribute('data-partner', 'false')
  })
})

describe('Actor with a face of its own', () => {
  function OtherFace({ seed, mood }: FaceProps) {
    return <span data-slot="other-face" data-seed={seed} data-mood={mood} />
  }

  it('draws the face it is given in place of the face of an agent', () => {
    const actor = renderActor({ acts: ['analyze'], face: OtherFace, mood: 'waiting' })

    expect(actor.querySelector('[data-slot=face]')).toBeNull()
    expect(actor.querySelector('[data-slot=other-face]')).toHaveAttribute('data-mood', 'waiting')
  })

  it('draws the other agent of a work with the same kind of face', () => {
    const actor = renderActor({ acts: ['interview'], partner: 'persona', face: OtherFace })

    expect(actor.querySelectorAll('[data-slot=other-face]')).toHaveLength(2)
  })
})
