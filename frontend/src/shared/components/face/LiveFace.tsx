'use client'

import { lazy, Suspense } from 'react'

import { animationLiveLink } from '@/shared/config/env'
import { useLiveFile } from '@/shared/lib/live'

import type { FaceProps } from './face.types'
import { PlainFace } from './PlainFace'

/** The runtime of the animation files and the drawing of a face by them are fetched when the first live face shows. */
const LiveFaceCanvas = lazy(() =>
  import('./live/LiveFaceCanvas').then((module) => ({ default: module.LiveFaceCanvas })),
)

/**
 * A face drawn by an animation file. Until that has loaded, the face is drawn plain, so that there is
 * a face at once and the same one after.
 */
export function LiveFace(props: FaceProps) {
  // A new file from the live link of a developer starts the face over, so that it is drawn by the new file.
  const version = useLiveFile(animationLiveLink)?.version ?? 0
  return (
    <Suspense fallback={<PlainFace {...props} />}>
      <LiveFaceCanvas key={version} {...props} />
    </Suspense>
  )
}
