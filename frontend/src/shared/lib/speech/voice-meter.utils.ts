/** The quietest level that counts as a voice, as a share of the loudest sound: a room is not a voice. */
const noiseFloor = 0.02
/** The level at which a voice counts as full; a louder one does not go further. */
const fullVoice = 0.25
/** How fast the level follows a rise of the voice, and how fast it lets go, as the share of the way taken in a frame. */
const attack = 0.5
const release = 0.12

/** The level of a voice from 0 to 1, from the samples of a frame of sound, as their loudness above the noise of the room. */
export function voiceLevelOf(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0
  // The samples are bytes centered on 128, as the browser gives the wave of a sound.
  const sum = Array.from(samples, (sample) => ((sample - 128) / 128) ** 2).reduce(
    (total, square) => total + square,
    0,
  )
  const loudness = Math.sqrt(sum / samples.length)
  return Math.min(1, Math.max(0, (loudness - noiseFloor) / (fullVoice - noiseFloor)))
}

/** The next level of a meter that rises fast with a voice and falls slowly when it stops, so that it moves like one. */
export function smoothedLevel(previous: number, next: number): number {
  return previous + (next - previous) * (next > previous ? attack : release)
}

/**
 * Listens to the microphone and reports the level of the voice on every frame, until the stop that
 * it resolves with is called. It asks the same microphone as dictation does, so the user is asked
 * once. It resolves with null when the microphone cannot be opened, such as when it is refused or
 * another use holds it, or when the browser keeps its audio from running: the caller then has no level and shows what it shows without one.
 */
export async function startVoiceMeter(
  onLevel: (level: number) => void,
): Promise<(() => void) | null> {
  if (typeof window === 'undefined' || !('mediaDevices' in navigator)) return null
  // Safari still names it with a prefix.
  const scope = window as unknown as {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  const AudioContextClass = scope.AudioContext ?? scope.webkitAudioContext
  if (AudioContextClass === undefined) return null
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    return null
  }
  const context = new AudioContextClass()
  // A context that was not made straight from a gesture can start suspended, and hears nothing
  // until it is resumed; one that stays so gives no level, which is not the same as a level of 0.
  try {
    await context.resume()
  } catch {
    // Judged by its state below.
  }
  if (context.state !== 'running') {
    for (const track of stream.getTracks()) track.stop()
    void context.close()
    return null
  }
  const analyser = context.createAnalyser()
  analyser.fftSize = 256
  context.createMediaStreamSource(stream).connect(analyser)
  const samples = new Uint8Array(analyser.fftSize)
  let level = 0
  let frame = 0
  const read = () => {
    analyser.getByteTimeDomainData(samples)
    level = smoothedLevel(level, voiceLevelOf(samples))
    onLevel(level)
    frame = window.requestAnimationFrame(read)
  }
  frame = window.requestAnimationFrame(read)

  return () => {
    window.cancelAnimationFrame(frame)
    for (const track of stream.getTracks()) track.stop()
    void context.close()
    onLevel(0)
  }
}
