'use client'

import { useRive } from '@rive-app/react-webgl2'
import { useTheme } from 'next-themes'
import { type RefObject, useEffect } from 'react'

import { animationLiveLink } from '@/shared/config/env'
import { rgbaOf } from '@/shared/lib/color'
import { useLiveFile } from '@/shared/lib/live'
import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import type { GazeValues, MoodLook } from '../../face.types'
import type { FaceLook } from '../../look/face-look.types'
import {
  liveColorTokens,
  liveFaceMachine,
  liveFaceSrc,
  liveNumberNames,
} from '../live-face.constants'
import type { LiveValues } from '../live-face.types'
import { liveValuesOf } from '../live-face.utils'

/**
 * Draws a face with the animation file and keeps it in step. This is the one place that knows the library that plays the file: the look and the mood are written to the
 * properties of the file when they change (the colors worked out from the tokens of the interface as
 * the element has them), and where the eyes look is written as it moves.
 */
export function useLiveFace(
  element: RefObject<HTMLElement | null>,
  look: FaceLook,
  moodLook: MoodLook,
  gaze: GazeValues,
) {
  const isStill = usePrefersReducedMotion()
  const { resolvedTheme } = useTheme()
  const liveFile = useLiveFile(animationLiveLink)
  const {
    rive: player,
    setCanvasRef,
    setContainerRef,
  } = useRive({
    ...(liveFile === null ? { src: liveFaceSrc } : { buffer: liveFile.buffer }),
    stateMachine: liveFaceMachine,
    autoplay: true,
    autoBind: true,
  })
  const valuesKey = JSON.stringify(liveValuesOf(look, moodLook, isStill))
  const colorsKey = look.colors.join()

  useEffect(() => {
    const instance = player?.viewModelInstance
    const target = element.current
    if (instance == null || target === null) return
    const values = JSON.parse(valuesKey) as LiveValues
    const silhouette = instance.enum('silhouette')
    if (silhouette !== null) silhouette.value = values.silhouette
    for (const name of liveNumberNames) {
      const property = instance.number(name)
      if (property !== null) property.value = values[name]
    }
  }, [player, element, valuesKey])

  // The colors are the ones of the theme, worked out once the theme has put its class on the page, so a change of theme is written again.
  useEffect(() => {
    const instance = player?.viewModelInstance
    const target = element.current
    if (instance == null || target === null) return
    const frame = requestAnimationFrame(() => {
      for (const [name, token] of Object.entries(liveColorTokens)) {
        const [red, green, blue, alpha] = rgbaOf(target, `var(${token})`)
        instance.color(name)?.argb(alpha, red, green, blue)
      }
    })
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [player, element, colorsKey, resolvedTheme])

  useEffect(() => {
    const instance = player?.viewModelInstance
    if (instance == null) return
    const lookX = instance.number('lookX')
    const lookY = instance.number('lookY')
    if (lookX === null || lookY === null) return
    const { eyeLine, eyeShift } = JSON.parse(valuesKey) as LiveValues
    const write = () => {
      lookX.value = gaze.eye.x.get() + eyeShift
      lookY.value = gaze.eye.y.get() + eyeLine
    }
    write()
    const stops = [gaze.eye.x.on('change', write), gaze.eye.y.on('change', write)]
    return () => {
      for (const stop of stops) stop()
    }
  }, [player, gaze, valuesKey])

  return { setCanvasRef, setContainerRef }
}
