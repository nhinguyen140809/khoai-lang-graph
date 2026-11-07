import { snakeToSentenceCase } from '@/shared/lib/text'
import { nonStatusTones, type Tone } from '@/shared/lib/tone'
import type { Wording } from '@/shared/lib/view'

import { valueLabelsByField } from './value-labels.constants'
import { valueTonesByField } from './value-tones.constants'

/**
 * The label of a value of a select field, in each view: the one written for the field at `path`,
 * else the value in sentence case in both views.
 */
export function valueLabel(path: string, value: string): Wording {
  const known = valueLabelsByField[path]?.[value]
  if (known !== undefined) return known
  const text = snakeToSentenceCase(value)
  return { developer: text, user: text }
}

/** The tone of a value of a badge field: the one written for the field at `path`, else neutral. */
export function valueTone(path: string, value: string): Tone {
  return valueTonesByField[path]?.[value] ?? 'neutral'
}

/**
 * A tone for each place in a list: the tones that carry no state, in turn and the color of the
 * app first, so that the places of one list tell themselves apart without reading as states.
 */
export function nonStatusTone(place: number): Tone {
  if (place <= 0) return nonStatusTones[0]
  return nonStatusTones[place % nonStatusTones.length] ?? 'neutral'
}
