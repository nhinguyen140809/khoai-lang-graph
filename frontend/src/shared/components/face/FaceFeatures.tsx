import { faceUnits } from './face.constants'
import type { EyeLife, GazeValues } from './face.types'
import { FaceEyes } from './FaceEyes'
import type { useFaceParts } from './hooks/useFaceParts'

const steadyEyes: readonly [EyeLife, EyeLife] = ['steady', 'steady']

/** The eyes of a face, in the dark color of the features, over whatever the face is filled with. */
export function FaceFeatures({
  parts: { moodLook, centers, line, isChanging, settle },
  gaze,
}: {
  parts: ReturnType<typeof useFaceParts>
  /** What follows the gaze of the mood, over time. */
  gaze: GazeValues
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
        lives={moodLook.eyeLives ?? steadyEyes}
        gaze={moodLook.gaze}
        gazeValues={gaze.eye}
        isChanging={isChanging}
        onClosed={settle}
      />
    </svg>
  )
}
