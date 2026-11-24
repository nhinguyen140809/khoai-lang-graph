import { describe, expect, it } from 'vitest'

import { faceMotions } from '../../motion/face-motion.constants'
import { bodyMotions, eyeLifeMotions, eyeMotions, poseMotions } from '../agent-motion.config'
import { plainEyeMotions } from '../agent-motion.constants'

describe('the motions of a face', () => {
  it('are listed as the page shows them, in the order of the registry', () => {
    expect(Object.keys(poseMotions)).toEqual(['none', ...faceMotions.poses])
    expect(Object.keys(bodyMotions)).toEqual(['none', ...faceMotions.bodies])
    expect(Object.keys(eyeLifeMotions)).toEqual([...plainEyeMotions.eyeLives])
    expect(Object.keys(eyeMotions)).toEqual([...plainEyeMotions.eyes])
  })
})
