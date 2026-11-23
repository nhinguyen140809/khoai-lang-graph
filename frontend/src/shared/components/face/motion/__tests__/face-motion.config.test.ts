import { describe, expect, it } from 'vitest'

import { bodyMotions, eyeLifeMotions, eyeMotions, poseMotions } from '../face-motion.config'
import { faceMotions } from '../face-motion.constants'

describe('the motions of a face', () => {
  it('are listed as the page shows them, in the order of the registry', () => {
    expect(Object.keys(poseMotions)).toEqual(['none', ...faceMotions.poses])
    expect(Object.keys(bodyMotions)).toEqual(['none', ...faceMotions.bodies])
    expect(Object.keys(eyeLifeMotions)).toEqual([...faceMotions.eyeLives])
    expect(Object.keys(eyeMotions)).toEqual([...faceMotions.eyes])
  })
})
