'use client'

import { faceMotions } from '@/shared/components/face'

import type { CardEntry } from '../../../design-system.types'
import { MotionFaces } from '../../MotionFaces'
import { SampleCard, SampleGroup } from '../../Sample'

export function FaceEyesCard() {
  return (
    <SampleCard
      title="Face eyes"
      description="The kinds of eye, what an eye does by itself, and where the eyes look."
      className="flex flex-col gap-10"
    >
      <SampleGroup label="Eyes: the kinds of eye; a kind that is open blinks, the shut, the smiling, the cross and the spiral ones do not">
        <MotionFaces names={faceMotions.eyes} overrideOf={(kind) => ({ eyes: [kind, kind] })} />
      </SampleGroup>
      <SampleGroup label="What an eye does by itself, besides the way it looks: still, swelling and shrinking, squinting now and then, or winking (one eye)">
        <MotionFaces
          names={faceMotions.eyeLives}
          overrideOf={(life) => ({
            eyeLives: life === 'wink' ? ['steady', 'wink'] : [life, life],
          })}
        />
      </SampleGroup>
      <SampleGroup label="Where the eyes look: each way of looking is a path over time, and the face turns a little with the eyes">
        <MotionFaces names={faceMotions.gazes} overrideOf={(gaze) => ({ gaze })} />
      </SampleGroup>
    </SampleCard>
  )
}

export const faceEyesCardEntry = {
  id: 'face-eyes',
  label: 'Face eyes',
  section: 'agents',
  span: 12,
  keywords: 'face eyes blink gaze wink look AgentFace',
  View: FaceEyesCard,
} satisfies CardEntry
