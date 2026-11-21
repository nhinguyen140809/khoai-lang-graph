/** How far `progress` has come between `from` and `to`, from 0 before `from` to 1 after `to`. */
export function stretchOf(progress: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (progress - from) / (to - from)))
}

/** How seen something is at the height `y` of an icon: whole between `top` and `bottom`, fading out over `fade` before each of them, and not at all beyond them. */
export function seenWithin(
  y: number,
  { top, bottom, fade }: { top: number; bottom: number; fade: number },
): number {
  return Math.min(1, Math.max(0, Math.min((y - top) / fade, (bottom - y) / fade)))
}
