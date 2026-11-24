'use client'

import { type CSSProperties, useId, useMemo } from 'react'

import { useEyeFade } from './hooks/useEyeFade'
import { eyeCenters, eyesMiddleY, eyesMidline, humanLookOffsets } from './human-face.constants'
import type { EyeLayerOptions, EyeShape } from './human-face.types'
import { elementsOf, eyeLayerMarkup, spotOf, variantOf, withTokens } from './human-face.utils'

type Side = 'left' | 'right'

/** One drawing of an eye, painted with the tokens of the face. */
function EyeLayer({
  shape,
  options,
  tokens,
  clipId,
  className,
  style,
}: {
  shape: EyeShape
  options: EyeLayerOptions
  tokens: Readonly<Record<string, string>>
  clipId: string
  className: string | undefined
  style?: CSSProperties
}) {
  const { hasIris, settleAt } = options
  const picture = useMemo(
    () =>
      elementsOf(
        withTokens(
          eyeLayerMarkup(variantOf('eyes', shape.variant)?.art ?? '', clipId, {
            isFlipped: shape.isFlipped,
            hasIris,
            ...(settleAt === undefined ? {} : { settleAt }),
          }),
          tokens,
        ),
      ),
    [shape.variant, shape.isFlipped, hasIris, settleAt, clipId, tokens],
  )
  return (
    <g className={className} style={style}>
      {picture}
    </g>
  )
}

/** One eye of the face: the part of the drawing of the eyes that lies on its side, which fades into the next drawing when the eye changes. */
function EyeSide({
  side,
  target,
  tokens,
  owner,
  motion,
}: {
  side: Side
  target: EyeShape
  tokens: Readonly<Record<string, string>>
  owner: string
  motion: 'pulse' | undefined
}) {
  const { from, to } = useEyeFade(target)
  const fromSpot = from === null ? null : spotOf(from.variant, side)
  const toSpot = spotOf(to.variant, side)
  // The iris stays where it was and grows or moves into its place while the lids change, if both eyes have one.
  const settle = fromSpot !== null && toSpot !== null ? { from: fromSpot, to: toSpot } : null
  const offset = target.look === null ? { x: 0, y: 0 } : humanLookOffsets[target.look]
  const settleStyle = {
    '--iris-dx': settle === null ? undefined : `${String(settle.from.x - settle.to.x)}px`,
    '--iris-dy': settle === null ? undefined : `${String(settle.from.y - settle.to.y)}px`,
    '--iris-scale': settle === null ? undefined : String(settle.from.size / settle.to.size),
  } as CSSProperties
  return (
    <g
      clipPath={`url(#${owner}-${side})`}
      style={
        {
          '--human-face-look-x': String(offset.x),
          '--human-face-look-y': String(offset.y),
        } as CSSProperties
      }
    >
      <g
        className={motion === 'pulse' ? 'human-face-pulse' : undefined}
        style={{ transformOrigin: `${String(eyeCenters[side])}px ${String(eyesMiddleY)}px` }}
      >
        {from !== null && (
          <EyeLayer
            key={`from-${from.variant}-${String(from.isFlipped)}`}
            shape={from}
            options={{ isFlipped: from.isFlipped, hasIris: settle === null }}
            tokens={tokens}
            clipId={`${owner}-${side}-from`}
            className="human-face-eye-out"
          />
        )}
        <EyeLayer
          key={`to-${to.variant}-${String(to.isFlipped)}`}
          shape={to}
          options={{
            isFlipped: to.isFlipped,
            hasIris: true,
            ...(settle === null ? {} : { settleAt: settle.to }),
          }}
          tokens={tokens}
          clipId={`${owner}-${side}-to`}
          className={from === null ? undefined : 'human-face-eye-in'}
          style={settleStyle}
        />
      </g>
    </g>
  )
}

/**
 * The eyes of a face, where the art places them: each eye is drawn from the variant that it has now
 * (the art draws a pair, and each eye takes the half of the drawing on its side), and fades into
 * the next one when it changes, its iris moving and growing into the next one's. An eye that no family has may have a motion of its own.
 */
export function HumanEyes({
  left,
  right,
  place,
  tokens,
  motion,
}: {
  left: EyeShape
  right: EyeShape
  place: string | undefined
  tokens: Readonly<Record<string, string>>
  motion: 'pulse' | undefined
}) {
  const owner = `human-face-eyes-${useId().replace(/\W/g, '')}`
  return (
    <g transform={place}>
      <clipPath id={`${owner}-left`}>
        <rect x={-1000} y={-1000} width={1000 + eyesMidline} height={3000} />
      </clipPath>
      <clipPath id={`${owner}-right`}>
        <rect x={eyesMidline} y={-1000} width={3000} height={3000} />
      </clipPath>
      <EyeSide side="left" target={left} tokens={tokens} owner={owner} motion={motion} />
      <EyeSide side="right" target={right} tokens={tokens} owner={owner} motion={motion} />
    </g>
  )
}
