import { act } from '@testing-library/react'
import { vi } from 'vitest'

interface StubbedRecognition {
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
  onresult: ((event: unknown) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
}

/**
 * Gives the page the speech recognition of a browser that has one: `state.recognition` is the one
 * that the code made last, and `hear` makes it hear words, the way the browser reports them.
 */
export function stubSpeechRecognition() {
  const state: { recognition: StubbedRecognition | null } = { recognition: null }
  vi.stubGlobal(
    'webkitSpeechRecognition',
    class {
      start = vi.fn()
      stop = vi.fn(() => {
        this.onend?.()
      })
      abort = vi.fn()
      onresult: ((event: unknown) => void) | null = null
      onend: (() => void) | null = null
      onerror: ((event: { error: string }) => void) | null = null
      constructor() {
        state.recognition = this
      }
    },
  )
  const hear = (text: string) => {
    act(() => {
      state.recognition?.onresult?.({ results: [{ isFinal: false, 0: { transcript: text } }] })
    })
  }
  return { state, hear }
}
