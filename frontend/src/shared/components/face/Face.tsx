'use client'

import type { ReactNode } from 'react'

import type { FaceProps, FaceStyleKey } from './face.types'
import { useFaceStyle } from './hooks/useFaceStyle'
import { LiveFace } from './LiveFace'
import { PlainFace } from './PlainFace'

/** The way to draw a face by how the interface draws them: one component for each. */
const faceStyles = {
  plain: PlainFace,
  live: LiveFace,
} as const satisfies Record<FaceStyleKey, (props: FaceProps) => ReactNode>

/**
 * A face, drawn the way that the interface draws them (see `FaceStyleProvider`): plain, in CSS, or
 * live, by an animation file. What a face is given means the same either way: one look from the seed
 * (or from its place in a workflow), one set of moods, the same way of looking about and moving.
 */
export function Face(props: FaceProps) {
  const Drawn = faceStyles[useFaceStyle()]
  return <Drawn {...props} />
}
