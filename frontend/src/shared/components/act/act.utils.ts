import type { Mood } from '@/shared/components/face'

import {
  acts,
  genericMood,
  orbitDepthScale,
  orbitFarSide,
  orbitRadius,
  slotPlaces,
} from './act.constants'
import {
  type Act,
  type ActKey,
  actKeys,
  type ActProp,
  type OrbitShape,
  type PropTone,
} from './act.types'

/** Whether a key names an act that is drawn. */
export function isDrawnAct(key: string): key is ActKey {
  return (actKeys as readonly string[]).includes(key) && acts[key as ActKey] !== undefined
}

/** The keys of a list that name an act that is drawn, in their order. */
export function drawnActsOf(keys: readonly string[]): ActKey[] {
  return keys.filter(isDrawnAct)
}

/** The act that a list of the acts that are drawn is at, going round it again and again: none when no act is drawn. */
export function wantedActOf(drawn: readonly ActKey[], index: number): ActKey | null {
  return drawn.length === 0 ? null : (drawn[index % drawn.length] ?? null)
}

/** The act of a key, or null when none is drawn for it. */
export function actOf(key: ActKey | null): Act | null {
  return key === null ? null : (acts[key] ?? null)
}

/**
 * The mood of the face of an actor: the mood that it is given, except the mood of work in general,
 * which gives way to the mood of the act; the mood of work in general when neither says another.
 */
export function moodOf(given: Mood | undefined, act: Act | null): Mood {
  if (given !== undefined && given !== genericMood) return given
  return act?.mood ?? given ?? genericMood
}

/** Where a thing stands, in shares of the size of the face from its middle: its slot, as far from the middle as `distance` says, moved by its `offset`. */
export function placeOf(item: Pick<ActProp, 'slot' | 'distance' | 'offset'>): {
  x: number
  y: number
} {
  const slot = slotPlaces[item.slot]
  const distance = item.distance ?? 1
  return {
    x: slot.x * distance + (item.offset?.x ?? 0),
    y: slot.y * distance + (item.offset?.y ?? 0),
  }
}

/**
 * The point of a thing on a ring round the middle of the face at `value` of a turn (from 0 to 1): the ring starts at `place`
 * and is as wide as `place` is far from the middle. The ring is leaned about the horizontal axis and then turned about
 * the line of sight. `x` and `y` are the move from `place`, in shares of the size of the face; `depth` is the share of the
 * point on the line of sight (up toward the viewer); `seen` is how much of the thing shows, which falls to nothing as the
 * far side of a leaned ring goes behind the face.
 */
export function orbitPoint(
  value: number,
  place: { x: number; y: number },
  { tilt, turn, reach }: OrbitShape,
): { x: number; y: number; depth: number; seen: number } {
  const radius = (Math.hypot(place.x, place.y) || orbitRadius) * reach
  const lean = (tilt * Math.PI) / 180
  const turned = (turn * Math.PI) / 180
  const angle = Math.atan2(place.y, place.x) + value * 2 * Math.PI
  const flatX = Math.cos(angle) * radius
  const flatY = Math.sin(angle) * Math.cos(lean) * radius
  const height = Math.sin(angle)
  const seen = lean === 0 ? 1 : (height - orbitFarSide.hidden) / orbitFarSide.span
  return {
    x: flatX * Math.cos(turned) - flatY * Math.sin(turned) - place.x,
    y: flatX * Math.sin(turned) + flatY * Math.cos(turned) - place.y,
    depth: height * Math.sin(lean),
    seen: Math.min(1, Math.max(0, seen)),
  }
}

/** The scale of a thing that is `depth` toward the viewer on a leaned ring: larger on the near side, smaller on the far side. */
export function depthScale(depth: number): number {
  return 1 + orbitDepthScale * depth
}

/** The color of a thing around the face: the one that its act gives, else the primary color. */
export function toneOf(item: Pick<ActProp, 'tone'>): PropTone {
  return item.tone ?? 'primary'
}
