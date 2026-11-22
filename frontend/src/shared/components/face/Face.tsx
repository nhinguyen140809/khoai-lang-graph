'use client'

import type { ReactNode } from 'react'

import type { FaceProps, FaceStyleKey } from './face.types'
import { useFaceStyle } from './hooks/useFaceStyle'
import { PlainFace } from './PlainFace'

/** The way to draw a face by how the interface draws them: one component for each. */
const faceStyles = {
  plain: PlainFace,
} as const satisfies Record<FaceStyleKey, (props: FaceProps) => ReactNode>

/**
 * A face, drawn the way that the interface draws them (see `FaceStyleProvider`). What a face is
 * given means the same whichever way it is drawn: one look from the seed, one set of moods, the same
 * way of looking about and moving. A new way of drawing a face is a component with the props of a
 * face, built on `useFace`, and an entry here.
 */
export function Face(props: FaceProps) {
  const Drawn = faceStyles[useFaceStyle()]
  return <Drawn {...props} />
}
