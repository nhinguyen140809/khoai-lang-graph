import { type FaceSpec, faceSpecOf } from '@/shared/components/face'

import type { ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import type { ContentValues } from '../values/content-values.types'

/**
 * The face that the content of an item carries, when its kind names an avatar: the field that
 * `x-ui-avatar` names holds a face spec. Null for a kind that names none, and for an item whose
 * field holds no spec: both draw the initials of the title instead, the rule of every surface.
 */
export function avatarOf(schema: ContentSchema, content: ContentValues): FaceSpec | null {
  const avatar = schema['x-ui-avatar']
  if (avatar === undefined) return null
  return faceSpecOf(content[avatar.field])
}
