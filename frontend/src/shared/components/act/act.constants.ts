import type { Act, ActKey, ActSize, Slot } from './act.types'

/** How far a thing around the face turns toward it, over standing as the default view draws it: the rest of the way keeps it open to the one that looks at the act. */
export const turnTowardFace = 0.6

/** How much the view of a thing follows its place up and down the act, in degrees over the whole height of it: the lower it stands, the more from above it is seen. */
export const pitchAlongPlace = 25

/** How deep the face of the actor stands behind the front of the stage, in shares of the size of the face: the way from a thing to it turns the thing by how far to the side of the act it stands, and no farther, so that a thing never turns its back on the one that looks. */
export const stageDepth = 0.6

/**
 * Where each slot is, as shares of the size of the face from its middle (to the right and down), and
 * where the eyes look to see it, in the units of a gaze path. The slots are close, so that what
 * stands in one reaches the edge of the face, and a thing may overlap it. The eyes look less far
 * than the slot is, because the eyes of a face can only go so far.
 */
export const slotPlaces: Readonly<
  Record<Slot, { x: number; y: number; look: { x: number; y: number } }>
> = {
  top: { x: 0, y: -0.62, look: { x: 0, y: -1.5 } },
  'top-right': { x: 0.52, y: -0.5, look: { x: 1.8, y: -1.2 } },
  right: { x: 0.66, y: 0, look: { x: 2.6, y: 0 } },
  'bottom-right': { x: 0.52, y: 0.5, look: { x: 1.8, y: 1.2 } },
  bottom: { x: 0, y: 0.64, look: { x: 0, y: 1.6 } },
  'bottom-left': { x: -0.52, y: 0.5, look: { x: -1.8, y: 1.2 } },
  left: { x: -0.66, y: 0, look: { x: -2.6, y: 0 } },
  'top-left': { x: -0.52, y: -0.5, look: { x: -1.8, y: -1.2 } },
  center: { x: 0, y: 0, look: { x: 0, y: 0 } },
}

/** How thick the strokes of the magnifying glass are where it stands over the face: thicker than the other icons, so that it reads over the eyes. */
const searchStroke = 2.25

/**
 * Three places round the face, a third of a turn apart, from which three things go round it flat
 * on one ring: the first at the top, the others at the lower right and the lower left.
 */
const onRing = {
  top: { slot: 'center', offset: { x: 0, y: -0.6 }, course: 'orbit' },
  lowerRight: { slot: 'center', offset: { x: 0.52, y: 0.3 }, course: 'orbit' },
  lowerLeft: { slot: 'center', offset: { x: -0.52, y: 0.3 }, course: 'orbit' },
} as const

/**
 * The acts of the catalog, each as it is drawn. An act has a mood only when its work asks one of
 * the face, such as the thinking of a hard problem or the pleasure of a thing saved; for the
 * others the face has the mood of work in general, with its eyes as they are.
 */
export const acts: Readonly<Partial<Record<ActKey, Act>>> = {
  write: {
    loopMs: 4200,
    // The eyes go from the pen, at the bottom, to the text, at the lower left, and back.
    look: [
      [0, 'bottom'],
      [0.35, 'bottom-left'],
      [0.7, 'bottom'],
      [1, 'bottom'],
    ],
    move: { move: 'nod', cycles: 2 },
    props: [
      {
        icon: 'textLeft',
        slot: 'bottom-left',
        distance: 0.85,
        from: 0,
        to: 1,
        enter: 'rise',
        exit: 'float-up',
        course: 'float',
      },
      { icon: 'pen', slot: 'bottom', distance: 0.6, from: 0, to: 1 },
    ],
  },
  read: {
    loopMs: 5000,
    look: [
      [0, 'left'],
      [0.5, 'right'],
      [1, 'left'],
    ],
    move: { move: 'bob', cycles: 3 },
    props: [
      { icon: 'textLeft', slot: 'left', from: 0, to: 0.6, enter: 'drop', exit: 'fall' },
      { icon: 'textRight', slot: 'right', from: 0.4, to: 1, enter: 'rise', exit: 'float-up' },
    ],
  },
  search: {
    loopMs: 7200,
    // The eyes stay to the right, where the glass is, and go up to the globe and down to the library.
    look: [
      [0, 'right'],
      [0.35, 'top-right'],
      [0.7, 'bottom-right'],
      [1, 'right'],
    ],
    props: [
      {
        icon: 'search',
        slot: 'center',
        offset: { x: -0.05, y: 0 },
        flip: true,
        stroke: searchStroke,
        from: 0,
        to: 1,
        enter: 'rise',
        effect: 'pulse',
        effectCycles: 3,
      },
      { icon: 'globe', slot: 'top-right', distance: 0.8, from: 0.1, to: 1, course: 'float' },
      { icon: 'library', slot: 'bottom-right', distance: 0.8, from: 0.2, to: 1 },
    ],
  },
  analyze: {
    mood: 'thinking',
    loopMs: 8000,
    look: [
      [0, 'top'],
      [0.4, 'right'],
      [0.7, 'left'],
      [1, 'top'],
    ],
    move: { move: 'lean', cycles: 1 },
    props: [
      { icon: 'chartSpline', ...onRing.top, from: 0, to: 1 },
      { icon: 'bars', ...onRing.lowerRight, from: 0, to: 1 },
      { icon: 'textLeft', ...onRing.lowerLeft, from: 0, to: 1 },
    ],
  },
  question: {
    loopMs: 3200,
    look: [
      [0, 'top-right'],
      [0.5, 'top'],
      [1, 'top-right'],
    ],
    move: { move: 'lean', cycles: 1 },
    props: [
      {
        tokens: ['?'],
        slot: 'top-right',
        from: 0,
        to: 1,
        size: 2.4,
        effect: 'wiggle',
        effectCycles: 2,
      },
    ],
  },
  code: {
    loopMs: 3600,
    // As in typing: the eyes go to the laptop, then up to where the symbols fly.
    look: [
      [0, 'bottom-right'],
      [0.5, 'top-right'],
      [1, 'bottom-right'],
    ],
    move: { move: 'tap', cycles: 6 },
    props: [
      { icon: 'laptop', slot: 'bottom-right', distance: 0.75, from: 0, to: 1 },
      {
        tokens: ['</>', '{ }', '=>', '( )', '&&'],
        slot: 'right',
        from: 0,
        to: 1,
      },
    ],
  },
  calculate: {
    mood: 'thinking',
    loopMs: 4800,
    // The numbers rise from above the face in three ways, straight up and slanting to each side,
    // and the eyes go from one to the next.
    look: [
      [0, 'top-left'],
      [0.33, 'top'],
      [0.66, 'top-right'],
      [1, 'top-left'],
    ],
    props: [
      {
        tokens: ['7', '+', '3', '=', '9', '12x4=48'],
        slot: 'top',
        from: 0,
        to: 1,
      },
      {
        tokens: ['x', '5', '-', '2', '8'],
        slot: 'top-left',
        distance: 0.9,
        from: 0.15,
        to: 1,
      },
      {
        tokens: ['/', '4', '%', '6', '+'],
        slot: 'top-right',
        distance: 0.9,
        from: 0.3,
        to: 1,
      },
    ],
  },
  plan: {
    loopMs: 10000,
    look: [
      [0, 'left'],
      [0.5, 'right'],
      [1, 'left'],
    ],
    move: { move: 'lean', cycles: 1 },
    props: [
      { icon: 'gantt', ...onRing.top, from: 0, to: 1 },
      { icon: 'kanban', ...onRing.lowerRight, from: 0, to: 1 },
      { icon: 'eventList', ...onRing.lowerLeft, from: 0, to: 1 },
    ],
  },
  fetch: {
    loopMs: 4000,
    look: [
      [0, 'top'],
      [0.5, 'bottom-right'],
      [1, 'top'],
    ],
    props: [
      {
        icon: 'layers',
        slot: 'top',
        from: 0,
        to: 1,
        enter: 'fade-in',
        course: 'float',
        distance: 1.1,
      },
      { icon: 'download', slot: 'bottom-right', from: 0, to: 1, course: 'hop', courseCycles: 2 },
    ],
  },
  review: {
    loopMs: 8000,
    look: [
      [0, 'left'],
      [0.33, 'top-left'],
      [0.66, 'bottom-left'],
      [1, 'left'],
    ],
    props: [
      // The lines of text that it reads come in turn: at its left, above that and below it.
      {
        icon: 'textLeft',
        slot: 'left',
        from: 0,
        to: 0.4,
        size: 1.3,
        enter: 'rise',
        exit: 'float-up',
        effect: 'blink',
      },
      {
        icon: 'textLeft',
        slot: 'top-left',
        from: 0.3,
        to: 0.7,
        size: 1.3,
        enter: 'rise',
        exit: 'float-up',
        effect: 'blink',
      },
      {
        icon: 'textLeft',
        slot: 'bottom-left',
        from: 0.6,
        to: 1,
        size: 1.3,
        enter: 'rise',
        exit: 'float-up',
        effect: 'blink',
      },
      {
        icon: 'search',
        slot: 'center',
        offset: { x: -0.05, y: 0 },
        stroke: searchStroke,
        from: 0,
        to: 1,
        enter: 'rise',
        course: 'sweep',
        axis: 'vertical',
        courseCycles: 2,
        reach: 2.5,
      },
    ],
  },
  compare: {
    loopMs: 4400,
    look: [
      [0, 'left'],
      [0.5, 'right'],
      [1, 'left'],
    ],
    props: [
      { icon: 'textLeft', slot: 'left', from: 0, to: 1, course: 'sweep' },
      { icon: 'textRight', slot: 'right', from: 0, to: 1, course: 'sweep' },
      { icon: 'ungroup', slot: 'top', from: 0.1, to: 1 },
    ],
  },
  save: {
    mood: 'happy',
    loopMs: 3600,
    look: [
      [0, 'bottom'],
      [0.5, 'right'],
      [1, 'bottom'],
    ],
    props: [
      { icon: 'download', slot: 'bottom', from: 0, to: 1, effect: 'tick', effectCycles: 2 },
      { icon: 'check', slot: 'right', from: 0.3, to: 1 },
    ],
  },
  typing: {
    loopMs: 3200,
    // The eyes go to the laptop, then up to where the words fly.
    look: [
      [0, 'bottom-right'],
      [0.5, 'top-right'],
      [1, 'bottom-right'],
    ],
    move: { move: 'bob', cycles: 12 },
    props: [
      { icon: 'laptop', slot: 'bottom-right', distance: 0.75, from: 0, to: 1 },
      {
        tokens: ['hi', 'hello', 'how', 'are'],
        slot: 'right',
        from: 0,
        to: 1,
      },
    ],
  },
  // Two agents face each other: the actor looks to the right, where the persona that it talks to
  // stands looking back, and bubbles that point opposite ways come one after another between them.
  interview: {
    loopMs: 3200,
    look: [
      [0, 'right'],
      [1, 'right'],
    ],
    move: { move: 'nod', cycles: 2 },
    props: [
      {
        partner: true,
        slot: 'right',
        distance: 2.6,
        from: 0,
        to: 1,
      },
      {
        icon: 'message',
        slot: 'right',
        distance: 1.3,
        offset: { x: -0.04, y: -0.38 },
        size: 1.3,
        from: 0,
        to: 0.55,
        enter: 'rise',
      },
      {
        tokens: ['?'],
        slot: 'bottom-right',
        size: 1.6,
        from: 0.04,
        to: 0.5,
        enter: 'fade-in',
        exit: 'fade-out',
      },
      {
        icon: 'message',
        slot: 'right',
        distance: 1.3,
        offset: { x: 0.08, y: -0.12 },
        size: 1.3,
        flip: true,
        from: 0.45,
        to: 1,
        enter: 'rise',
      },
    ],
  },
  // Many texts, left, centered and right, come in toward the face from all round it, one after another, as what is read is
  // gathered into one: from above they come down, from the sides and from below they come in.
  summarize: {
    loopMs: 5000,
    look: [
      [0, 'top-left'],
      [0.25, 'right'],
      [0.5, 'bottom-left'],
      [0.75, 'top-right'],
      [1, 'top-left'],
    ],
    move: { move: 'swell', cycles: 1 },
    props: [
      { icon: 'textCenter', slot: 'top-left', from: 0, to: 0.7, course: 'gather', size: 0.8 },
      {
        icon: 'textLeft',
        slot: 'right',
        from: 0.1,
        to: 0.8,
        course: 'gather',
        axis: 'horizontal',
        size: 0.8,
      },
      {
        icon: 'textRight',
        slot: 'bottom-left',
        from: 0.2,
        to: 0.9,
        course: 'gather',
        axis: 'horizontal',
        size: 0.8,
      },
      { icon: 'textLeft', slot: 'top-right', from: 0.3, to: 1, course: 'gather', size: 0.8 },
      {
        icon: 'textCenter',
        slot: 'left',
        from: 0.4,
        to: 1,
        course: 'gather',
        axis: 'horizontal',
        size: 0.8,
      },
      {
        icon: 'textRight',
        slot: 'bottom-right',
        from: 0.5,
        to: 1,
        course: 'gather',
        axis: 'horizontal',
        size: 0.8,
      },
    ],
  },
  link: {
    loopMs: 4000,
    look: [
      [0, 'bottom'],
      [0.5, 'right'],
      [1, 'bottom'],
    ],
    props: [
      { icon: 'nodes', slot: 'bottom', distance: 0.8, from: 0, to: 1, size: 1.6 },
      { icon: 'fork', slot: 'right', distance: 0.8, from: 0.2, to: 1, size: 1.4 },
    ],
  },
  // The documents of a project are packed into a file: a zipped file at the left, and a pile of the
  // documents at the right.
  export: {
    loopMs: 3600,
    look: [
      [0, 'left'],
      [0.5, 'right'],
      [1, 'left'],
    ],
    props: [
      { icon: 'zip', slot: 'left', from: 0, to: 1 },
      { icon: 'layers', slot: 'right', from: 0, to: 1 },
    ],
  },
}

/** How many rounds an act goes through before the next act of a list takes its place. */
export const actDwellRounds = 2

/** How long what is around a face takes to go when the act changes, and to come in for the new one, in milliseconds. */
export const actFadeMs = { out: 200, in: 350 } as const

/** The distance from the face of a thing that goes round it from the middle, as a share of the face. */
export const orbitRadius = 0.7

/** How much larger a thing on the near side of a leaned orbit is than at its slot, and how much smaller on the far side, as a share of its size. */
export const orbitDepthScale = 0.3

/** The far side of a leaned orbit: a thing is out of sight where its height on the ring is below `hidden`, and in full sight `span` above it. */
export const orbitFarSide = { hidden: -0.2, span: 0.5 } as const

/** Where the eyes look when an act has no look: to the right, from the start of a round to its end. */
export const restingLook = [
  [0, 'right'],
  [1, 'right'],
] as const

/** How large a thing around the face is, as a share of the face. */
export const propSize = 0.5

/**
 * The mood that stands for work in general, such as the mood of the status of a run that works.
 * It does not say what the work is, so a face that is given it takes the mood of its act, and has
 * it only when its act has none.
 */
export const genericMood = 'working'

/** The frame of an actor by the size of its face; whole class names, so that they are generated. */
export const actorFrameClasses = {
  lg: 'actor-frame-lg',
  xl: 'actor-frame-xl',
  '2xl': 'actor-frame-2xl',
} as const satisfies Record<ActSize, string>
