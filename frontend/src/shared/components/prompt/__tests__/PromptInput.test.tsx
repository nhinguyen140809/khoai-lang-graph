import { screen } from '@testing-library/react'
import { memo, type ReactNode, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import {
  expectDisabled,
  expectFieldValue,
  expectNoAccessibilityViolations,
  expectNoRole,
  expectRole,
  expectText,
  pressButton,
  typeText,
} from '@/test/steps'

import { PromptBar, PromptBarEnd, PromptBarStart, PromptSend } from '../box/PromptBar'
import { PromptBox, PromptTextarea } from '../box/PromptBox'
import { PromptAddMenu } from '../footer/PromptAddMenu'
import { PromptFooter, PromptFooterEnd, PromptFooterStart } from '../footer/PromptFooter'
import { usePromptLooks, usePromptSubmit, usePromptText } from '../hooks/usePromptInput'
import type { PromptInputSize } from '../prompt-input.types'
import { PromptInput } from '../PromptInput'

/** The name that the prompt has unless a test gives it another, so that its text is found by name. */
const promptName = 'Message to the agents'

interface TestPromptProps {
  onValueChange?: (value: string) => void
  onSubmit?: (text: string) => void
  label?: string
  isPending?: boolean
  size?: PromptInputSize
  /** Parts that a place puts in each region of the prompt; the default send stands at the end of the box. */
  aboveText?: ReactNode
  barStart?: ReactNode
  barEnd?: ReactNode
  footerStart?: ReactNode
  footerEnd?: ReactNode
}

/** The prompt composed of its parts, with its text kept in a state, as the place that renders it keeps it. */
function TestPrompt({
  onValueChange = vi.fn(),
  onSubmit = vi.fn(),
  label = promptName,
  isPending,
  size,
  aboveText,
  barStart,
  barEnd,
  footerStart,
  footerEnd,
}: TestPromptProps) {
  const [value, setValue] = useState('')
  return (
    <PromptInput
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
      onSubmit={onSubmit}
      keysHint="Enter to send, Shift+Enter for a new line"
      label={label}
      {...(isPending !== undefined && { isPending })}
      {...(size !== undefined && { size })}
    >
      <PromptBox>
        {aboveText}
        <PromptTextarea placeholder="Ask or request a change" />
        <PromptBar>
          <PromptBarStart>{barStart}</PromptBarStart>
          <PromptBarEnd>{barEnd ?? <PromptSend label="Send" />}</PromptBarEnd>
        </PromptBar>
      </PromptBox>
      <PromptFooter>
        <PromptFooterStart>{footerStart}</PromptFooterStart>
        <PromptFooterEnd>{footerEnd}</PromptFooterEnd>
      </PromptFooter>
    </PromptInput>
  )
}

function promptWith(overrides: TestPromptProps = {}) {
  const onValueChange = vi.fn()
  const view = renderWithProviders(<TestPrompt onValueChange={onValueChange} {...overrides} />)
  return { ...view, onValueChange }
}

describe('PromptInput', () => {
  it('sends the trimmed text on Enter', async () => {
    const onSubmit = vi.fn()
    const { onValueChange } = promptWith({ onSubmit })
    const box = screen.getByRole('textbox')
    await typeText(box, '  A request for the agents.  ')
    expect(onValueChange).toHaveBeenCalled()

    await typeText(box, '{Enter}')

    expect(onSubmit).toHaveBeenCalledWith('A request for the agents.')
  })

  it('adds a line on Shift+Enter and sends nothing', async () => {
    const onSubmit = vi.fn()
    promptWith({ onSubmit })
    const box = screen.getByRole('textbox')
    await typeText(box, 'A request{Shift>}{Enter}{/Shift}for the agents.')

    expect(onSubmit).not.toHaveBeenCalled()
    expectFieldValue(promptName, 'A request\nfor the agents.')
  })

  it('sends nothing while a composition is open', async () => {
    const onSubmit = vi.fn()
    promptWith({ onSubmit })
    const box = screen.getByRole('textbox')
    await typeText(box, 'A request')
    box.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
    )

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends nothing while the request is pending, and the arrow spins', async () => {
    const onSubmit = vi.fn()
    promptWith({ onSubmit, isPending: true })

    const box = screen.getByRole('textbox')
    await typeText(box, 'A request')

    expectDisabled('button', 'Send')
    await typeText(box, '{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders the submit action passed in instead of the default send', async () => {
    promptWith({ barEnd: <button type="button">Stop</button> })

    await expectRole('button', 'Stop')
    expectNoRole('button', 'Send')
  })

  it('renders the row inside the box with both sides', async () => {
    promptWith({
      barStart: <button type="button">Attach</button>,
      barEnd: <button type="button">Voice</button>,
    })

    await expectRole('button', 'Attach')
    await expectRole('button', 'Voice')
  })

  it('puts its send in the row of the text when slim, not under it', () => {
    promptWith({ size: 'slim' })

    const addon = screen
      .getByRole('button', { name: 'Send' })
      .closest('[data-slot="input-group-addon"]')
    expect(addon).toHaveAttribute('data-align', 'inline-end')
  })

  it('renders the parts that a place puts in each side of the row under the box', async () => {
    promptWith({
      footerStart: <button type="button">Run settings</button>,
      footerEnd: <button type="button">Later</button>,
    })

    await expectRole('button', 'Run settings')
    await expectRole('button', 'Later')
  })

  it('opens the menu of the plus with the items that the place gives it', async () => {
    promptWith({
      footerEnd: (
        <PromptAddMenu>
          <p>An item</p>
        </PromptAddMenu>
      ),
    })

    await expectRole('button', 'Add')
    await pressButton('Add')
    await expectText('An item')
  })

  it('reads its keys to assistive technology only', async () => {
    promptWith()

    expect(screen.getByText('Enter to send, Shift+Enter for a new line')).toHaveClass('sr-only')
    await expectNoAccessibilityViolations()
  })
})

describe('PromptInput contexts', () => {
  it('draws again only the parts that read what changed', async () => {
    const looksDrawn = vi.fn()
    const textDrawn = vi.fn()
    const submitDrawn = vi.fn()
    // Without props, a part is drawn again only when a context that it reads changes.
    const LooksPart = memo(function LooksPart() {
      usePromptLooks()
      looksDrawn()
      return null
    })
    const TextPart = memo(function TextPart() {
      usePromptText()
      textDrawn()
      return null
    })
    const SubmitPart = memo(function SubmitPart() {
      usePromptSubmit()
      submitDrawn()
      return null
    })
    promptWith({
      aboveText: (
        <>
          <LooksPart />
          <TextPart />
          <SubmitPart />
        </>
      ),
    })
    const box = screen.getByRole('textbox')
    await typeText(box, 'A')
    const drawn = {
      looks: looksDrawn.mock.calls.length,
      text: textDrawn.mock.calls.length,
      submit: submitDrawn.mock.calls.length,
    }

    await typeText(box, 'bcd')

    // The text changed with every key and the way to send did not: it was ready after the first.
    expect(textDrawn.mock.calls.length).toBeGreaterThan(drawn.text)
    expect(looksDrawn.mock.calls.length).toBe(drawn.looks)
    expect(submitDrawn.mock.calls.length).toBe(drawn.submit)
  })
})
