import type { GazeValues } from '../face.types'
import type { useFaceMotionStates } from '../motion/hooks/useFaceMotionStates'
import { faceUnits } from './agent-face.constants'
import { FaceEyes } from './FaceEyes'
import type { useFaceParts } from './hooks/useFaceParts'

/** The eyes of a face, in the dark color of the features, over whatever the face is filled with. */
export function FaceFeatures({
  parts: { moodLook, centers, line, isChanging, settle },
  gaze,
  motion,
}: {
  parts: ReturnType<typeof useFaceParts>
  /** What follows the gaze of the mood, over time. */
  gaze: GazeValues
  /** The state of each motion of the face. */
  motion: ReturnType<typeof useFaceMotionStates>
}) {
  return (
    <svg
      viewBox={`0 0 ${String(faceUnits)} ${String(faceUnits)}`}
      className="relative size-full fill-current text-(--face-features)"
    >
      <FaceEyes
        kinds={moodLook.eyes}
        centers={centers}
        scales={moodLook.eyeScales}
        line={line}
        tilts={moodLook.tilts}
        lives={motion.lives}
        gaze={moodLook.gaze}
        gazeValues={gaze.eye}
        isChanging={isChanging}
        isBlinking={motion.isBlinking}
        onClosed={settle}
      />
    </svg>
  )
}
