import { afterEach, describe, expect, it, vi } from 'vitest'

import { smoothedLevel, startVoiceMeter, voiceLevelOf } from '../voice-meter.utils'

/** A frame of sound of one loudness: samples that swing this far from the middle, as bytes. */
function frameOf(swing: number) {
  return Array.from({ length: 64 }, (_, index) => 128 + (index % 2 === 0 ? swing : -swing))
}

describe('voiceLevelOf', () => {
  it('is 0 for silence and for the noise of a room', () => {
    expect(voiceLevelOf(frameOf(0))).toBe(0)
    expect(voiceLevelOf(frameOf(2))).toBe(0)
    expect(voiceLevelOf([])).toBe(0)
  })

  it('rises with the loudness of a voice and stops at 1', () => {
    expect(voiceLevelOf(frameOf(10))).toBeGreaterThan(0)
    expect(voiceLevelOf(frameOf(20))).toBeGreaterThan(voiceLevelOf(frameOf(10)))
    expect(voiceLevelOf(frameOf(127))).toBe(1)
  })
})

describe('smoothedLevel', () => {
  it('rises faster than it falls', () => {
    const rise = smoothedLevel(0, 1)
    const fall = 1 - smoothedLevel(1, 0)

    expect(rise).toBeGreaterThan(fall)
  })
})

/** A microphone and an audio context that start in this state and, once resumed, are in the other. */
function stubAudio({ resumedState }: { resumedState: 'running' | 'suspended' }) {
  const stopTrack = vi.fn()
  const close = vi.fn(() => Promise.resolve())
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'suspended'
      resume = vi.fn(() => {
        this.state = resumedState
        return Promise.resolve()
      })
      close = close
      createAnalyser = () => ({ fftSize: 0, getByteTimeDomainData: vi.fn() })
      createMediaStreamSource = () => ({ connect: vi.fn() })
    },
  )
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [{ stop: stopTrack }] })),
    },
    configurable: true,
  })
  return { stopTrack, close }
}

describe('startVoiceMeter', () => {
  // `navigator.mediaDevices` is not a global that the setup puts back, so the test removes it.
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'mediaDevices')
  })

  it('resumes an audio context that starts suspended, and gives a way to stop', async () => {
    const { stopTrack, close } = stubAudio({ resumedState: 'running' })

    const stop = await startVoiceMeter(vi.fn())
    stop?.()

    expect(stop).not.toBeNull()
    expect(stopTrack).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })

  it('gives no meter, and lets go of the microphone, when the audio stays suspended', async () => {
    const { stopTrack, close } = stubAudio({ resumedState: 'suspended' })

    const stop = await startVoiceMeter(vi.fn())

    expect(stop).toBeNull()
    expect(stopTrack).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })
})
