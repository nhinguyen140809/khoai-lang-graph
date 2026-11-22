import { screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { stubSpeechRecognition } from '@/test/browser'
import { renderWithProviders } from '@/test/render'
import {
  expectFieldValue,
  expectNoRole,
  expectRole,
  expectText,
  pressButton,
  typeText,
} from '@/test/steps'

import type { DictationSize } from '../dictation.types'
import { DictationButton } from '../DictationButton'
import { DictationGlow } from '../DictationGlow'
import { DictationProvider } from '../DictationProvider'

const fieldName = 'Notes'

/** A text that a dictation writes into, kept as the place that owns it keeps it. */
function Notes({ size = 'short' }: { size?: DictationSize }) {
  const [text, setText] = useState('')
  return (
    <DictationProvider value={text} onValueChange={setText}>
      <div>
        <DictationGlow />
        <input
          aria-label={fieldName}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
          }}
        />
        <DictationButton size={size} />
      </div>
    </DictationProvider>
  )
}

describe('DictationButton', () => {
  it('is not drawn in a browser that cannot turn speech into text', () => {
    renderWithProviders(<Notes />)

    expectNoRole('button', 'Dictate')
  })

  it('writes what is heard after the text that was there, and keeps it when it is stopped', async () => {
    const { hear } = stubSpeechRecognition()
    renderWithProviders(<Notes />)
    await typeText(screen.getByRole('textbox'), 'A mentor app')

    await pressButton('Dictate')
    hear('for students')

    expectFieldValue(fieldName, 'A mentor app for students')
    await pressButton('Stop')
    expectFieldValue(fieldName, 'A mentor app for students')
    await expectRole('button', 'Dictate')
  })

  it('puts the text back as it was when it is cancelled', async () => {
    const { hear } = stubSpeechRecognition()
    renderWithProviders(<Notes />)
    await typeText(screen.getByRole('textbox'), 'A mentor app')

    await pressButton('Dictate')
    hear('for students')
    await pressButton('Cancel dictation')

    expectFieldValue(fieldName, 'A mentor app')
    await expectRole('button', 'Dictate')
  })

  it('names its state to a screen reader as the same button turns into the one that stops', async () => {
    stubSpeechRecognition()
    renderWithProviders(<Notes />)

    await pressButton('Dictate')

    await expectText('Listening')
    await expectRole('button', 'Stop')
  })

  it.each([
    { size: 'short', bars: 4 },
    { size: 'long', bars: 14 },
  ] as const)('listens with $bars bars when it is $size', async ({ size, bars }) => {
    stubSpeechRecognition()
    const { container } = renderWithProviders(<Notes size={size} />)

    await pressButton('Dictate')

    expect(container.querySelectorAll('.animate-listen')).toHaveLength(bars)
  })
})

describe('DictationGlow', () => {
  it('draws no light, and runs no animation of one, until it listens', async () => {
    stubSpeechRecognition()
    const { container } = renderWithProviders(<Notes />)

    expect(container.querySelector('[data-slot="glow"]')).toBeNull()
    await pressButton('Dictate')
    expect(container.querySelector('[data-slot="glow"]')).not.toBeNull()
    await pressButton('Stop')
    await waitFor(() => {
      expect(container.querySelector('[data-slot="glow"]')).toBeNull()
    })
  })

  it('draws no light in a browser that cannot listen', () => {
    const { container } = renderWithProviders(<Notes />)

    expect(container.querySelector('[data-slot="glow"]')).toBeNull()
    expect(container.querySelector('[data-active]')).toBeNull()
  })
})
