import type { FacePreset } from './face-look.types'

/**
 * The faces that an agent can have, made by hand: each is a set (an outline, how far apart the eyes
 * are, one or two colors of the palette, and where and how the blobs of color sit) that is meant to
 * be told from every other at a glance. An agent takes one by its place in the workflow, or by its
 * key when it has none. To add a face, add an entry at the end: the ones before it keep their
 * agents.
 */
export const facePresets = [
  {
    shape: 'circle',
    gap: 'mid',
    colors: ['var(--hue-violet)', 'var(--hue-pink)'],
    reach: 84,
    spots: [
      { x: 38, y: 36 },
      { x: 66, y: 68 },
    ],
    blobs: [
      { shape: 'round', turn: 0 },
      { shape: 'ellipse', turn: 30 },
    ],
  },
  {
    shape: 'squircle',
    gap: 'near',
    colors: ['var(--hue-sky)', 'var(--hue-mint)'],
    reach: 80,
    spots: [
      { x: 60, y: 40 },
      { x: 34, y: 70 },
    ],
    blobs: [
      { shape: 'blob', turn: 60 },
      { shape: 'round', turn: 0 },
    ],
  },
  {
    shape: 'ghost',
    gap: 'far',
    colors: ['var(--hue-orange)', 'var(--hue-rose)'],
    reach: 88,
    spots: [
      { x: 44, y: 32 },
      { x: 62, y: 72 },
    ],
    blobs: [
      { shape: 'round', turn: 0 },
      { shape: 'streak', turn: 120 },
    ],
  },
  {
    shape: 'pill',
    gap: 'mid',
    colors: ['var(--hue-mint)', 'var(--hue-lime)'],
    reach: 78,
    spots: [
      { x: 30, y: 50 },
      { x: 72, y: 46 },
    ],
    blobs: [
      { shape: 'ellipse', turn: 10 },
      { shape: 'ellipse', turn: 170 },
    ],
  },
  {
    shape: 'drop',
    gap: 'near',
    colors: ['var(--hue-blue)'],
    reach: 90,
    spots: [
      { x: 52, y: 58 },
      { x: 40, y: 36 },
    ],
    blobs: [
      { shape: 'round', turn: 0 },
      { shape: 'blob', turn: 90 },
    ],
  },
  {
    shape: 'hexagon',
    gap: 'far',
    colors: ['var(--hue-yellow)', 'var(--hue-orange)'],
    reach: 82,
    spots: [
      { x: 56, y: 34 },
      { x: 36, y: 68 },
    ],
    blobs: [
      { shape: 'blob', turn: 140 },
      { shape: 'round', turn: 0 },
    ],
  },
  {
    shape: 'blob',
    gap: 'mid',
    colors: ['var(--hue-rose)', 'var(--hue-coral)'],
    reach: 86,
    spots: [
      { x: 42, y: 44 },
      { x: 70, y: 62 },
    ],
    blobs: [
      { shape: 'round', turn: 0 },
      { shape: 'streak', turn: 40 },
    ],
  },
  {
    shape: 'oval',
    gap: 'near',
    colors: ['var(--hue-violet)', 'var(--hue-blue)'],
    reach: 76,
    spots: [
      { x: 64, y: 38 },
      { x: 30, y: 62 },
    ],
    blobs: [
      { shape: 'ellipse', turn: 20 },
      { shape: 'blob', turn: 150 },
    ],
  },
] as const satisfies readonly FacePreset[]
