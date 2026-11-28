'use client'

import { boardAssetOf } from '../SpecIcon'
import type { BoardMark } from './board.types'

/** The marks of a document: a title, lines of words, and a diagram of three boxes joined by lines, in shares of the sheet. */
const marks: readonly BoardMark[] = [
  {
    rect: { from: [0.08, 0.9], to: [0.62, 0.928] },
    face: 'b',
  },
  {
    rect: { from: [0.08, 0.82], to: [0.92, 0.846] },
    face: 'a',
  },
  {
    rect: { from: [0.08, 0.76], to: [0.74, 0.786] },
    face: 'a',
  },
  {
    rect: { from: [0.08, 0.7], to: [0.92, 0.726] },
    face: 'a',
  },
  {
    rect: { from: [0.08, 0.64], to: [0.55, 0.666] },
    face: 'a',
  },
  {
    rect: { from: [0.08, 0.58], to: [0.92, 0.606] },
    face: 'a',
  },
  {
    rect: { from: [0.09, 0.28], to: [0.28, 0.44] },
    face: 'b',
  },
  {
    rect: { from: [0.41, 0.28], to: [0.6, 0.44] },
    face: 'b',
  },
  {
    rect: { from: [0.73, 0.28], to: [0.92, 0.44] },
    face: 'b',
  },
  {
    rect: { from: [0.28, 0.352], to: [0.41, 0.368] },
    face: 'a',
  },
  {
    rect: { from: [0.6, 0.352], to: [0.73, 0.368] },
    face: 'a',
  },
]

/**
 * A document drawn as an asset: a translucent sheet standing a little back from straight, with
 * the marks of a page on it, a title, lines of words and a diagram. It stands still over the
 * round, and what stands behind the sheet is seen through it, whichever way it is seen from.
 */
export const DocumentAsset = boardAssetOf('sheet', marks)
