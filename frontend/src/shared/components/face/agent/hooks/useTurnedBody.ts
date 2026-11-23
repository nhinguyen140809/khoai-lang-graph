'use client'

import type { MotionStyle } from 'motion/react'

import type { BodyStyle, GazeValues } from '../../face.types'
import { useSum } from '../../motion/hooks/useSum'

/**
 * The style of the body of the face of an agent, which has no head apart from its body: the turns
 * of the head with the eyes add to the turns of the body.
 */
export function useTurnedBody(body: BodyStyle, head: GazeValues['head']): MotionStyle {
  const rotateX = useSum(head.rotateX, body.rotateX)
  const rotateY = useSum(head.rotateY, body.rotateY)
  return { ...body, rotateX, rotateY, rotateZ: head.rotateZ }
}
