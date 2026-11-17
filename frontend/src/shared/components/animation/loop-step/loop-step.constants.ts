/** How long one cycle of a loop lasts, in seconds, when the loop does not say. */
export const loopSeconds = 4.5

// Where each phase of a cycle ends, as a share of it. Every step starts hidden and ends hidden, so
// the end of a cycle joins its start without a jump: first the steps come in one after another,
// they stay together for a while, then they all fade out at once.
export const loopFadeShare = 0.05
export const loopHoldUntil = 0.88
export const loopGoneAt = 0.95
