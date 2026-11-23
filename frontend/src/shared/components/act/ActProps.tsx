'use client'

import { cn } from 'cn'
import { motion, type MotionValue, useMotionValue, useTransform } from 'motion/react'
import type { ComponentType } from 'react'

import type { FaceProps } from '@/shared/components/face'
import { stretchOf } from '@/shared/lib/animation'

import { propSize, slotPlaces } from './act.constants'
import type { Act, ActProp, ActSize, IconKey, Slot } from './act.types'
import { courseShift, depthScale, placeOf, toneOf, wayOf } from './act.utils'
import {
  appearShare,
  courses,
  defaultEffectCycles,
  effects,
  entrances,
  exits,
} from './act-motion.constants'
import { propIcons } from './act-props.constants'
import { ActTokens } from './ActTokens'
import { useOrbit } from './hooks/useOrbit'
import { usePropTracks } from './hooks/usePropTracks'

interface ActPropsProps {
  act: Act
  /** The round of the act, from 0 to 1, as a value that changes over time. */
  round: MotionValue<number>
  /** How much of what is around the face shows, from nothing to all of it. */
  gain: MotionValue<number>
  /** The slots that may be used; a thing of the act that stands in another slot is left out. */
  allowed: readonly Slot[]
  /** The size of the face of the actor, which the size of the other agent follows. */
  size: ActSize
  /** What the face of the other agent of a work done by two comes from; without it that agent is left out. */
  partner: string | undefined
  /** How a face is drawn: the other agent has the same kind of face as the actor. */
  face: ComponentType<FaceProps>
}

/** What an act draws around a face: each of its things, at its slot, over its stretch of the round. */
export function ActProps({ act, round, gain, allowed, size, partner, face }: ActPropsProps) {
  return (
    <motion.span
      aria-hidden
      className="act-layer pointer-events-none absolute inset-0"
      style={{ opacity: gain }}
    >
      {act.props
        .filter(
          (item) => allowed.includes(item.slot) && (item.partner !== true || partner !== undefined),
        )
        .flatMap((item, index) =>
          Array.from({ length: item.copies ?? 1 }, (_, copy) => (
            <Thing
              key={`${String(index)}-${String(copy)}`}
              item={item}
              round={round}
              offset={copy / (item.copies ?? 1)}
              size={size}
              partner={partner}
              face={face}
            />
          )),
        )}
    </motion.span>
  )
}

/**
 * One thing around the face. Its stretch of the round runs from 0 to 1, and from it four motions
 * are worked out, each by its name: how it comes in at the start, how it goes at the end, its
 * course about its slot and its effect in its place. Each copy of a thing is at a point of its
 * course and of its effect of its own (`offset`, a share of the round).
 */
function Thing({
  item,
  round,
  offset,
  size,
  partner,
  face,
}: {
  item: ActProp
  round: MotionValue<number>
  offset: number
  size: ActSize
  partner: string | undefined
  face: ComponentType<FaceProps>
}) {
  const slot = slotPlaces[item.slot]
  const place = placeOf(item)
  const course = courses[item.course ?? 'stay']
  const reach = item.reach ?? 1

  const progress = useTransform(round, (value) => stretchOf(value, item.from, item.to))
  const enterAt = useTransform(progress, (value) => stretchOf(value, 0, appearShare))
  const exitAt = useTransform(progress, (value) => stretchOf(value, 1 - appearShare, 1))
  const courseAt = useTransform(
    progress,
    (value) => (value * (item.courseCycles ?? 1) + offset) % 1,
  )
  const effectAt = useTransform(
    progress,
    (value) => (value * (item.effectCycles ?? defaultEffectCycles) + offset) % 1,
  )
  // The other agent of a work stays for the whole of the act, and comes and goes with the act, not with each round.
  const isPartner = item.partner === true
  const enter = usePropTracks(enterAt, isPartner ? {} : entrances[item.enter ?? 'zoom-out'])
  const exit = usePropTracks(exitAt, isPartner ? {} : exits[item.exit ?? 'zoom-in'])
  const moved = usePropTracks(courseAt, course.tracks)
  const effect = usePropTracks(effectAt, item.effect === undefined ? {} : effects[item.effect])

  // Round the face: the thing goes along a ring whose middle is the middle of the face.
  const orbit = useOrbit(
    courseAt,
    place,
    { tilt: item.tilt ?? 0, turn: item.turn ?? 0, reach },
    course.isOrbit === true,
  )

  // Sideways, the up and down of the course go out from the face (up is out) on the side of the slot.
  const side = place.x < 0 ? -1 : 1
  const way = wayOf(item.axis, course.axis)
  const left = useTransform<number, string>(
    [moved.x, moved.y, orbit.x, enter.x, exit.x],
    ([along, down, round, ...rest]) => {
      const shift = courseShift(way, side, along ?? 0, down ?? 0)
      return `${String(50 + (place.x + shift.x * reach + (round ?? 0) + sum(rest)) * 100)}%`
    },
  )
  const top = useTransform<number, string>(
    [moved.x, moved.y, orbit.y, enter.y, exit.y],
    ([along, down, round, ...rest]) => {
      const shift = courseShift(way, side, along ?? 0, down ?? 0)
      return `${String(50 + (place.y + shift.y * reach + (round ?? 0) + sum(rest)) * 100)}%`
    },
  )
  const scale = useTransform<number, number>(
    [enter.scale, exit.scale, moved.scale, effect.scale, orbit.depth],
    ([a, b, c, d, depth]) =>
      (a ?? 1) * (b ?? 1) * (c ?? 1) * (d ?? 1) * (item.size ?? 1) * depthScale(depth ?? 0),
  )
  const opacity = useTransform<number, number>(
    [enter.opacity, exit.opacity, moved.opacity, effect.opacity, orbit.seen],
    ([a, b, c, d, shown]) => (a ?? 1) * (b ?? 1) * (c ?? 1) * (d ?? 1) * (shown ?? 1),
  )
  const rotate = useTransform<number, number>(
    [moved.rotate, effect.rotate],
    ([a, b]) => (a ?? 0) + (b ?? 0),
  )

  return (
    <motion.span
      className={cn('absolute', !isPartner && 'aspect-square')}
      data-slot="act-prop"
      data-tone={toneOf(item)}
      style={{
        left,
        top,
        ...(!isPartner && { width: `${String(propSize * 100)}%` }),
        x: '-50%',
        y: '-50%',
        scale,
        scaleX: item.flip === true ? -1 : 1,
        opacity,
        rotate,
      }}
    >
      <ThingContent
        item={item}
        progress={progress}
        size={size}
        partner={partner}
        face={face}
        lean={Math.sign(slot.x) as -1 | 0 | 1}
      />
    </motion.span>
  )
}

function ThingContent({
  item,
  progress,
  size,
  partner,
  face,
  lean,
}: {
  item: ActProp
  progress: MotionValue<number>
  size: ActSize
  partner: string | undefined
  face: ComponentType<FaceProps>
  lean: -1 | 0 | 1
}) {
  if (item.icon !== undefined) {
    return <PropIcon icon={item.icon} progress={progress} stroke={item.stroke} />
  }
  if (item.tokens !== undefined)
    return <ActTokens progress={progress} tokens={item.tokens} lean={lean} />
  return partner === undefined ? null : <PartnerFace face={face} seed={partner} size={size} />
}

/** The other agent of a work done by two: its eyes look toward the actor, which stands to the left of it. */
function PartnerFace({
  face: Face,
  seed,
  size,
}: {
  face: ComponentType<FaceProps>
  seed: string
  size: ActSize
}) {
  const x = useMotionValue(-2.6)
  const y = useMotionValue(0)
  const weight = useMotionValue(1)
  return <Face seed={seed} size={size} mood="idle" drive={{ look: { x, y, weight } }} />
}

function PropIcon({
  icon,
  progress,
  stroke,
}: {
  icon: IconKey
  progress: MotionValue<number>
  stroke: number | undefined
}) {
  const Icon = propIcons[icon]
  return <Icon progress={progress} stroke={stroke} />
}

function sum(values: readonly (number | undefined)[]): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}
