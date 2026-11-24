import { type ReactNode, useMemo } from 'react'

import type { FaceSpec, HumanDrawing } from '../human-face.types'
import { backgroundOf, drawFace, elementsOf } from '../human-face.utils'

/**
 * The picture of a face, drawn again only when the seed, the spec or what the mouth is drawn as
 * changes, and what paints the background behind it. `renderEyes` makes the eyes that stand in the
 * place that the art gives them (see `elementsOf`); the picture is made again when it changes, which
 * it should only when the eyes do.
 */
export function useHumanFaceArt(
  seed: string,
  spec: FaceSpec | null | undefined,
  { mouth }: HumanDrawing,
  renderEyes: (place: string | undefined) => ReactNode,
): { picture: ReactNode; background: string } {
  const picture = useMemo(
    () => elementsOf(drawFace(seed, spec, { mouth }), renderEyes),
    [seed, spec, mouth, renderEyes],
  )
  return { picture, background: backgroundOf(seed, spec) }
}
