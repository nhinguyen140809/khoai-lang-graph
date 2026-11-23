import type { FaceProps, MotionLook } from '../face.types'

/** What the face of a person is given: what every face is given. */
export type HumanFaceProps = FaceProps

/** What a mood does to the face of a person: to the whole of it, and whether its eyes are shut. */
export interface HumanMoodLook extends MotionLook {
  /** The eyes are shut for the whole of the mood, such as in sleep; open when it is not given. */
  isEyesShut?: boolean
}
