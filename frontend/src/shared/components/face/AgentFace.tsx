'use client'

import type { ReactNode } from 'react'

import type { FaceProps, FaceStyleKey } from './face.types'
import { useFaceStyle } from './hooks/useFaceStyle'
import { PlainFace } from './PlainFace'

/** The ways to draw the face of an agent, which the interface picks from: one component for each. */
const faceStyles = {
  plain: PlainFace,
} as const satisfies Record<FaceStyleKey, (props: FaceProps) => ReactNode>

/**
 * The face of an agent, drawn the way that the interface draws them (see `FaceStyleProvider`). The
 * face of a person is another face with the same props (`FaceProps`), beside this one. What a face is
 * given means the same whichever way it is drawn: one look from the seed, one set of moods, the same
 * way of looking about and moving. A new way of drawing a face is a component with the props of a
 * face, built on `useFace`, and an entry here.
 */
export function AgentFace(props: FaceProps) {
  const Drawn = faceStyles[useFaceStyle()]
  return <Drawn {...props} />
}
