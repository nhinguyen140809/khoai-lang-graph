'use client'

import {
  courses,
  effects,
  entrances,
  exits,
  faceMoves,
  MotionDemo,
  type MotionDemoMotion,
} from '@/shared/components/act'

import { SampleCard, SampleGroup, SampleLabel } from '../Sample'

// The orbits to see, each by its name: how it leans (tilt) and turns, how wide it goes, where it
// starts, how many things are on it and how fast it goes round.
const orbitLooks: Record<string, MotionDemoMotion> = {
  flat: { copies: 1 },
  'flat, three': { copies: 3 },
  'leaned 30': { tilt: 30, copies: 2 },
  'leaned 65': { tilt: 65, copies: 2 },
  'leaned 80': { tilt: 80, copies: 3 },
  'leaned 65, turned 45': { tilt: 65, turn: 45, copies: 2 },
  'leaned 65, turned -45': { tilt: 65, turn: -45, copies: 2 },
  'leaned 80, turned 90': { tilt: 80, turn: 90, copies: 3 },
  wide: { tilt: 60, reach: 1.6, copies: 2 },
  tight: { reach: 0.6, copies: 2 },
  'five on a ring': { tilt: 55, turn: -20, copies: 5 },
  'from the top': { slot: 'top', tilt: 60, copies: 2 },
  'from the left': { slot: 'left', tilt: 70, copies: 2 },
  'fast, twice round': { tilt: 60, courseCycles: 2, copies: 2 },
}

// Where a thing may stand, each by its name: the nine slots, nearer and farther, and moved from a slot.
const positionLooks: Record<string, MotionDemoMotion> = {
  'top-left': { slot: 'top-left' },
  top: { slot: 'top' },
  'top-right': { slot: 'top-right' },
  left: { slot: 'left' },
  'center (on the face)': { slot: 'center' },
  right: { slot: 'right' },
  'bottom-left': { slot: 'bottom-left' },
  bottom: { slot: 'bottom' },
  'bottom-right': { slot: 'bottom-right' },
  'right, distance 0.6': { slot: 'right', distance: 0.6 },
  'right, distance 1.5': { slot: 'right', distance: 1.5 },
  'top-right, distance 0.6 (over the corner)': { slot: 'top-right', distance: 0.6 },
  'top-left, distance 0.6 (over the corner)': { slot: 'top-left', distance: 0.6 },
  'bottom, distance 0.4 (over the chin)': { slot: 'bottom', distance: 0.4 },
  'top, distance 0.4 (over the brow)': { slot: 'top', distance: 0.4 },
  'center, large (covers the face)': { slot: 'center', size: 2.4 },
  'center, moved up (forehead)': { slot: 'center', offset: { x: 0, y: -0.3 } },
  'center, moved down (chin)': { slot: 'center', offset: { x: 0, y: 0.3 } },
  'center, moved to the side': { slot: 'center', offset: { x: 0.25, y: 0 } },
  'right, moved up': { slot: 'right', offset: { x: 0, y: -0.3 } },
}

/** The names of a vocabulary, as the names that it holds. */
function keysOf<Vocabulary extends object>(vocabulary: Vocabulary): (keyof Vocabulary & string)[] {
  return Object.keys(vocabulary) as (keyof Vocabulary & string)[]
}

/** The demonstrations with what all of them share, which each may say otherwise. */
function withDefaults(
  looks: Record<string, MotionDemoMotion>,
  defaults: MotionDemoMotion,
): Record<string, MotionDemoMotion> {
  return Object.fromEntries(
    Object.entries(looks).map(([name, motion]) => [name, { ...defaults, ...motion }]),
  )
}

/** One demonstration for each name of a vocabulary, in the order of the vocabulary: `motionOf` says what the name does. */
function lookOf<Name extends string>(
  names: readonly Name[],
  motionOf: (name: Name) => MotionDemoMotion,
): Record<string, MotionDemoMotion> {
  return Object.fromEntries(names.map((name) => [name, motionOf(name)]))
}

/** The courses that go on as copies one after another, or as a ring, so that one copy shows nothing of them. */
const courseCopies: Partial<Record<keyof typeof courses, number>> = {
  orbit: 3,
  burst: 3,
  gather: 3,
}

function MotionRow({ looks }: { looks: Record<string, MotionDemoMotion> }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 px-10 py-8 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(looks).map(([name, motion]) => (
        <div key={name} className="flex flex-col items-start gap-8">
          <MotionDemo seed="analyst" motion={motion} />
          <SampleLabel>{name}</SampleLabel>
        </div>
      ))}
    </div>
  )
}

/** The demonstrations of the courses, and of burst and gather turned to go sideways. */
const courseLooks: Record<string, MotionDemoMotion> = {
  ...lookOf(keysOf(courses), (course) => ({
    course,
    courseCycles: course === 'orbit' ? 1 : 2,
    copies: courseCopies[course] ?? 1,
  })),
  'burst sideways': { course: 'burst', courseCycles: 2, copies: 3, axis: 'horizontal' },
  'gather sideways': { course: 'gather', courseCycles: 2, copies: 3, axis: 'horizontal' },
}

export function MotionsCard() {
  return (
    <SampleCard
      title="Act motions"
      description="The motions that the acts are made of, each by its name and each alone: how a thing comes in and goes, how it moves about its slot, what it does in its place, and how the whole face moves. An act puts some of them together."
      className="flex flex-col gap-6"
    >
      <SampleGroup label="Coming in (enter)">
        <MotionRow looks={lookOf(keysOf(entrances), (enter) => ({ enter }))} />
      </SampleGroup>
      <SampleGroup label="Going (exit)">
        <MotionRow looks={lookOf(keysOf(exits), (exit) => ({ exit }))} />
      </SampleGroup>
      <SampleGroup label="About its slot (course); copies of orbit make a ring (flat, or leaned like the orbit of a satellite), copies of burst and gather go one after another">
        <MotionRow looks={courseLooks} />
      </SampleGroup>
      <SampleGroup label="Orbits: a ring that is flat or leaned, turned about the line of sight, wide or tight, from another slot, and with more or fewer copies">
        <MotionRow looks={withDefaults(orbitLooks, { course: 'orbit', courseCycles: 1 })} />
      </SampleGroup>
      <SampleGroup label="Position (slot, distance and offset): a thing may stand over the face; distance 1 is as far from the middle as the slot is, 0 is on the middle">
        <MotionRow looks={withDefaults(positionLooks, { enter: 'none', exit: 'none' })} />
      </SampleGroup>
      <SampleGroup label="In its place (effect)">
        <MotionRow looks={lookOf(keysOf(effects), (effect) => ({ effect }))} />
      </SampleGroup>
      <SampleGroup label="Of the whole face (move)">
        <MotionRow looks={lookOf(keysOf(faceMoves), (move) => ({ move }))} />
      </SampleGroup>
    </SampleCard>
  )
}
