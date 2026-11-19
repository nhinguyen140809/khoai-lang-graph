import { faceUnits } from './face.constants'
import { FaceBrows } from './FaceBrows'
import { FaceEyes } from './FaceEyes'
import type { useFaceParts } from './hooks/useFaceParts'

/** The eyes and the brows of a face, in the dark color of the features, over whatever the face is filled with. */
export function FaceFeatures({
  parts: { moodLook, kind, centers, isChanging, settle },
}: {
  parts: ReturnType<typeof useFaceParts>
}) {
  return (
    <svg
      viewBox={`0 0 ${String(faceUnits)} ${String(faceUnits)}`}
      className="relative size-full fill-current text-(--face-features)"
    >
      <FaceBrows brows={moodLook.brows} centers={centers} kind={kind} scale={moodLook.eyeScale} />
      <FaceEyes
        kind={kind}
        centers={centers}
        scale={moodLook.eyeScale}
        gaze={moodLook.gaze}
        isChanging={isChanging}
        onClosed={settle}
      />
    </svg>
  )
}
