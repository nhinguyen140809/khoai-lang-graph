'use client'

import { cn } from 'cn'
import { motion } from 'motion/react'

import { faceSizeClasses } from '../face.constants'
import type { FaceProps } from '../face.types'
import { useFace } from '../hooks/useFace'
import { blobStyleOf } from '../look/face-style.utils'
import { useLiveFace } from './hooks/useLiveFace'

/**
 * A face drawn by an animation file. What it is given comes from the same tables as the plain face:
 * the look of its seed and the look of its mood are written to the properties of the file, which
 * draws them and eases from one to the next; where the eyes look is the same path of the same hook,
 * written to the file as it moves, and the motion of the whole face is the same too. The file
 * blinks the eyes itself.
 */
export function LiveFaceCanvas({
  seed,
  place,
  mood = 'idle',
  drive,
  size = 'default',
  className,
}: FaceProps) {
  const { look, ref, isRested, parts, gaze, poseStyle, bodyStyle } = useFace({
    seed,
    place,
    mood,
    drive,
  })
  const { setCanvasRef, setContainerRef } = useLiveFace(ref, look, parts.moodLook, gaze)

  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="face"
      data-style="live"
      data-mood={mood}
      data-resting={isRested || undefined}
      className={cn('relative inline-flex shrink-0 face-stage', faceSizeClasses[size], className)}
      style={blobStyleOf(look)}
    >
      <motion.span className="face-pose" style={poseStyle}>
        <motion.span data-body={parts.moodLook.body} className="face-body" style={bodyStyle}>
          <span ref={setContainerRef} className="block size-full">
            <canvas ref={setCanvasRef} className="size-full" />
          </span>
        </motion.span>
      </motion.span>
    </span>
  )
}
