import { eyeGeometries, eyeLine, eyeSpacing, faceUnits } from './face.constants'
import type { Brow, EyeKind } from './face.types'
import type { EyeGap } from './face-look.types'

// Every brow is one quadratic curve, whatever its look, so that the browser can move from one to
// another while a mood changes; a brow that is not shown keeps a neutral shape and fades.

/** An eye that a brow is over: its kind, where it is centered, and how large it is as a multiple of its usual size. */
interface BrowEye {
  kind: EyeKind
  cx: number
  scale: number
}

/**
 * The path of a brow over an eye; `side` is the eye it is over. The brow is as wide as the eye and
 * sits a little above its top.
 */
export function browPath(brow: Brow, side: 'left' | 'right', eye: BrowEye): string {
  const { halfWidth, halfHeight } = eyeGeometries[eye.kind]
  const half = halfWidth * eye.scale
  const top = eyeLine - halfHeight * eye.scale
  const from = String(eye.cx - half)
  const to = String(eye.cx + half)
  const middle = String(eye.cx)
  const above = (clearance: number) => String(top - clearance)
  switch (brow) {
    case 'arch':
      return `M${from} ${above(1.6)}Q${middle} ${above(3.6)} ${to} ${above(1.6)}`
    case 'raised':
      return `M${from} ${above(3.4)}Q${middle} ${above(5.6)} ${to} ${above(3.4)}`
    case 'slant':
      // The end by the nose is the high one, so the two brows slope down to the sides.
      return side === 'left'
        ? `M${from} ${above(0.8)}Q${middle} ${above(2.2)} ${to} ${above(3.6)}`
        : `M${from} ${above(3.6)}Q${middle} ${above(2.2)} ${to} ${above(0.8)}`
    case 'flat':
    case 'none':
      return `M${from} ${above(1.4)}Q${middle} ${above(1.4)} ${to} ${above(1.4)}`
  }
}

/**
 * The centers of the left and the right eye. The space between the eyes is the same share of the
 * face whatever the size of the face, and the eyes are as wide apart as their own width needs, so
 * wide eyes never touch and a small face has the same look as a large one.
 */
export function eyeCentersOf(kind: EyeKind, gap: EyeGap, scale = 1): readonly [number, number] {
  const half = (2 * eyeGeometries[kind].halfWidth * scale + eyeSpacing[gap]) / 2
  const middle = faceUnits / 2
  return [middle - half, middle + half]
}
