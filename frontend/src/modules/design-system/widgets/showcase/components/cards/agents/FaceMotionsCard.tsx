'use client'

import { faceMotions } from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { MotionFaces } from '../../MotionFaces'
import { SampleCard, SampleGroup } from '../../Sample'

/** What a motion of a face is for, in the words of the run. */
const motionUses = {
  sway: 'a small sway to each side',
  tilt: 'a tilt to one side, then the other',
  rest: 'a slow breath in the plane of the page',
  pulse: 'zooms in slowly, then fast',
  breathe: 'a slow breath of the whole face',
  bounce: 'jumps straight up and down',
  turnaround: 'turns right around now and then',
} as const

export function FaceMotionsCard() {
  return (
    <SampleCard
      title="Face motions"
      description="How the whole face moves: its pose in the plane of the page, and its body about the middle of its depth."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="Pose: how the whole face moves in the plane of the page, pivoting on its bottom">
        <MotionFaces
          names={faceMotions.poses}
          overrideOf={(pose) => ({ pose })}
          uses={motionUses}
        />
      </SampleGroup>
      <SampleGroup label="Body: what the face does as a whole, about the middle of its depth (the live face turns by a squeeze, as a flat file has no depth)">
        <MotionFaces
          names={faceMotions.bodies}
          overrideOf={(body) => ({ body })}
          uses={motionUses}
        />
      </SampleGroup>
    </SampleCard>
  )
}

export const faceMotionsCardEntry = {
  id: 'face-motions',
  label: 'Face motions',
  section: 'agents',
  span: 6,
  keywords: 'face motion pose body sway tilt pulse bounce Face',
  View: FaceMotionsCard,
} satisfies CardEntry
