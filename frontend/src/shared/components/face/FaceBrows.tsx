import type { Brow, EyeKind } from './face.types'
import { browPath } from './face.utils'
import { partStyle } from './face-style.utils'

interface FaceBrowsProps {
  /** The left brow and the right brow. */
  brows: readonly [Brow, Brow]
  /** The centers of the left and the right eye, which the brows are over. */
  centers: readonly [number, number]
  kind: EyeKind
  scale: number
}

/** The two brows. Each is always drawn, in a neutral shape that fades when it is not shown, so that it can move to its next shape. */
export function FaceBrows({ brows, centers, kind, scale }: FaceBrowsProps) {
  return (
    <g strokeWidth={1.5} strokeLinecap="round" stroke="currentColor" fill="none">
      {brows.map((brow, index) => {
        const side = index === 0 ? 'left' : 'right'
        const path = browPath(brow, side, { cx: centers[index === 0 ? 0 : 1], kind, scale })
        return <path key={side} className="face-morph" style={partStyle(path, brow !== 'none')} />
      })}
    </g>
  )
}
