import type { FaceState, Mood, RestingMood } from '../face.types'

/** How long a change of mood waits for the eyes to close before it goes on, if they never say they have, in milliseconds. */
export const swapFallbackMs = 600

/** The moods whose face comes to rest, and the state that each comes to. */
export const restingStates = {
  idle: 'resting-idle',
  happy: 'resting-happy',
} as const satisfies Record<RestingMood, FaceState>

/** How long a face of a mood that comes to rest has nothing to do before it does, in milliseconds. */
export const restAfterMs = 20000

/** The moods that go through looks one after another while they last, and for how long each look stays, in milliseconds; the first is the look of the mood, and after the last it comes round again. Each change is covered by a blink, as a change of mood is. The squinting look stays for a whole round of a squint (4.3 seconds, which the squint comes late in) so that the eyes squint while it lasts. */
export const moodCycles: Readonly<
  Partial<Record<Mood, readonly { state: FaceState; ms: number }[]>>
> = {
  thinking: [
    { state: 'thinking', ms: 6000 },
    { state: 'thinking-long', ms: 3500 },
    { state: 'thinking-squint', ms: 4500 },
  ],
}
