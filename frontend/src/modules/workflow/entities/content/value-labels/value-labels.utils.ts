import { snakeToSentenceCase } from '@/shared/lib/formatters'
import type { Wording } from '@/shared/lib/view'

import { valueLabelsByField } from './value-labels.constants'

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
