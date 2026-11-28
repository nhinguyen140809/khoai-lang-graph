/** A mark drawn on a board: a rectangle, a line of a width, a round dot, or a shape of other corners, so far across and so far up it in shares of its width and its height, in one of the two tones of an asset. */
export type BoardMark = BoardRectMark | BoardLineMark | BoardDotMark | BoardShapeMark

/** A mark as a rectangle on the face of the board, from one corner of it to the other. */
export interface BoardRectMark extends BoardMarkTone {
  rect: {
    from: readonly [number, number]
    to: readonly [number, number]
  }
}

/** A mark as a line of a width through points, from the first of them to the last. */
export interface BoardLineMark extends BoardMarkTone {
  line: {
    points: readonly (readonly [number, number])[]
    /** How wide it runs, in shares of the height of the board. */
    width: number
  }
}

/** A mark as a round dot on the face of the board: where its middle stands, and how wide it runs, in shares of the height of the board. */
export interface BoardDotMark extends BoardMarkTone {
  dot: {
    at: readonly [number, number]
    radius: number
  }
}

/** A mark as a shape of given corners on the face of the board, in order around it. */
export interface BoardShapeMark extends BoardMarkTone {
  corners: readonly (readonly [number, number])[]
}

/** The tone a mark is drawn in, whether it shows a light of its own, and how it moves over the round of the clock. */
interface BoardMarkTone {
  face: 'a' | 'b'
  glow?: boolean | undefined
  /** How the mark moves over the round of the clock, told as data; none, and it stands still. */
  move?: BoardMarkMove | undefined
}

/**
 * How a mark of a board moves over the round of its clock, told as data. The curves are those of
 * the icons that a clock draws stroke by stroke, so a moving board keeps their feel.
 */
export type BoardMarkMove =
  /** Slides to and fro along the row of the board, as far as `reach` to each side, in its own time along the round. */
  | { slide: { reach: number; phase: number } }
  /** Grows and shortens from its `head` or its `foot`, in its own time: never shorter than three fifths of itself. */
  | { grow: { phase: number; from: 'head' | 'foot' } }
  /** Is drawn in from its start to its end over a stretch of the round. */
  | { reveal: { from: number; to: number } }
  /** Shows over a stretch of the round and stays. */
  | { appear: { from: number; to: number } }
  /** Lights up over a stretch of the round and dims again after, never below a third. */
  | { light: { from: number; to: number } }
  /** Drifts up the board by `by` over the round, seen whole between the `within` edges of it and fading before them. */
  | { cycle: { by: number; within: { bottom: number; top: number; fade: number } } }

/** The shapes a board comes in, each named: how wide and how tall it stands. */
export const boardShapes = {
  sheet: { width: 11, height: 13.5 },
  square: { width: 11, height: 11 },
  panel: { width: 13.5, height: 8.5 },
  banner: { width: 13, height: 5 },
} as const

export type BoardShape = keyof typeof boardShapes
