/**
 * How the two rings are drawn: `mixed` has a nearly round first ring and an uneven second ring;
 * `angular` has rings that go through shapes that look the same after each third of a turn: a rounded triangle, a rounded hexagon, a three-lobed shape, a three-point star.
 */
export type RingsVariant = 'mixed' | 'angular'

/** Six values, one for each point of a shape. */
export type PerPoint<Value> = readonly [Value, Value, Value, Value, Value, Value]

/**
 * A closed outline of six curves, one from each of its six points to the next. A point is at an
 * angle of a sixth of a turn from the one before it; `radii` are its distance from the middle (1 is
 * the full radius), `turns` how far it moves from that angle in degrees, and `handles` how long the
 * handles of the curves leaving and reaching it are: about 0.36 makes a circle, less makes a corner.
 */
export interface RingShape {
  radii: PerPoint<number>
  turns: PerPoint<number>
  handles: PerPoint<number>
}

/** The two colors of the rings, as any CSS colors: the first ring first. */
export type RingsColors = readonly [string, string]
