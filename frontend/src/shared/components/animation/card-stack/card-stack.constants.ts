/** How long the front card stays before the next one comes forward, in milliseconds. */
export const cardStackIntervalMs = 4500
/** How far each card behind the front one rises above the one before it, in pixels. */
export const cardStackPeekPx = 8
/** How much smaller each card behind is than the one before it. */
export const cardStackShrink = 0.07
/** How much fainter each card behind is than the one before it. */
export const cardStackFade = 0.32

export const cardStackSpring = { type: 'spring', stiffness: 170, damping: 24 } as const
/** How long the front card takes to fade away and come back at the end of the pile, in seconds. */
export const cardStackTurnSeconds = 0.75
/** The share of that time in which it fades away in front; it comes back in the rest. */
export const cardStackLeaveShare = 0.5
/** How large the front card grows while it fades away, as a multiple of its size. */
export const cardStackLeaveScale = 1.08
