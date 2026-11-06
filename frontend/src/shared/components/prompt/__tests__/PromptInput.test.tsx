import { screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, typeText } from '@/test/steps'

import { PromptInput } from '../PromptInput'

/** The prompt with its text kept in a state, as the place that renders it keeps it. */
function TestPrompt({
  onValueChange = vi.fn(),
  ...props
}: Partial<Parameters<typeof PromptInput>[0]> & { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <PromptInput
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
      onSubmit={vi.fn()}
      submitLabel="Send"
      keysHint="Enter to send, Shift+Enter for a new line"
      placeholder="Ask or request a change"
      {...props}
    />
  )
}

function promptWith(overrides: Partial<Parameters<typeof PromptInput>[0]> = {}) {
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
    expect(box).toHaveValue('A request\nfor the agents.')
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
    promptWith({ onSubmit, isPending: true, label: 'Message to the agents' })

    const box = screen.getByRole('textbox')
    await typeText(box, 'A request')

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    await typeText(box, '{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders the submit action passed in instead of the default send', () => {
    promptWith({ endActions: <button type="button">Stop</button> })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument()
  })

  it('renders the row inside the box with both sides', () => {
    promptWith({
      startActions: <button type="button">Attach</button>,
      endActions: <button type="button">Voice</button>,
    })

    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument()
  })

  it('puts its send in the row of the text when slim, not under it', () => {
    promptWith({ size: 'slim' })

    const addon = screen
      .getByRole('button', { name: 'Send' })
      .closest('[data-slot="input-group-addon"]')
    expect(addon).toHaveAttribute('data-align', 'inline-end')
  })

  it('renders the row under the box with both sides, and nothing without them', () => {
    const { rerender } = promptWith({
      footerStart: <button type="button">Run settings</button>,
      footerEnd: <button type="button">Later</button>,
    })

    expect(screen.getByRole('button', { name: 'Run settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument()

    rerender(<TestPrompt />)

    expect(screen.queryByRole('button', { name: 'Run settings' })).not.toBeInTheDocument()
  })

  it('reads its keys to assistive technology only', async () => {
    promptWith({ label: 'Message to the agents' })

    expect(screen.getByText('Enter to send, Shift+Enter for a new line')).toHaveClass('sr-only')
    await expectNoAccessibilityViolations()
  })
})
