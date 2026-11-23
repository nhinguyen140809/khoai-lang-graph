import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectRole, pressButton } from '@/test/steps'

import { ReadAloudButton } from '../read-aloud-button'

/** The voice of a browser that has one: it keeps the last utterance, which a test can end. */
function stubSpeech() {
  const state: { utterance: { text: string; onend: (() => void) | null } | null } = {
    utterance: null,
  }
  const synthesis = {
    speak: vi.fn((utterance: { text: string; onend: (() => void) | null }) => {
      state.utterance = utterance
    }),
    cancel: vi.fn(() => {
      state.utterance?.onend?.()
    }),
  }
  vi.stubGlobal('speechSynthesis', synthesis)
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = ''
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      text: string
      constructor(text: string) {
        this.text = text
      }
    },
  )
  return { state, synthesis }
}

describe('ReadAloudButton', () => {
  it('lets a second reading take the voice from the first without being cut off by it', async () => {
    const { state } = stubSpeech()
    renderWithProviders(
      <>
        <ReadAloudButton value="First" label="Read first" stopLabel="Stop first" />
        <ReadAloudButton value="Second" label="Read second" stopLabel="Stop second" />
      </>,
    )
    await pressButton('Read first')

    await pressButton('Read second')

    // The first reading ends as the second takes the voice, and the second goes on.
    await expectRole('button', 'Read first')
    await expectRole('button', 'Stop second')
    expect(state.utterance?.text).toBe('Second')
  })

  it('is not drawn in a browser with no voice', () => {
    renderWithProviders(<ReadAloudButton value="Hello" />)

    expectNoRole('button', 'Read aloud')
  })

  it('reads the words of the text without its marks, and stops when it is pressed again', async () => {
    const { state, synthesis } = stubSpeech()
    renderWithProviders(<ReadAloudButton value="**Done** with the [brief](https://x.test)" />)

    await pressButton('Read aloud')

    expect(state.utterance?.text).toBe('Done with the brief')
    await expectRole('button', 'Stop reading')
    await pressButton('Stop reading')
    expect(synthesis.cancel).toHaveBeenCalled()
    await expectRole('button', 'Read aloud')
  })

  it('reads in the language that the letters of the text show', async () => {
    const { state } = stubSpeech()
    renderWithProviders(<ReadAloudButton value="Phân tích đã hoàn thành, bạn xem lại giúp mình" />)

    await pressButton('Read aloud')

    expect((state.utterance as { lang?: string } | null)?.lang).toBe('vi-VN')
  })

  it('goes back to reading when the voice has read to the end', async () => {
    const { state } = stubSpeech()
    renderWithProviders(<ReadAloudButton value="Hello" />)
    await pressButton('Read aloud')

    act(() => {
      state.utterance?.onend?.()
    })

    await expectRole('button', 'Read aloud')
  })
})
