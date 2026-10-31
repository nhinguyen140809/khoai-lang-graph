import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'

import { CopyButton } from '../copy-button'

const writeText = vi.fn(() => Promise.resolve())

// jsdom has no clipboard, and userEvent.setup() gives the page one of its own: the test writes
// over it after the user is set up, so that it sees what the button copied.
function stubClipboard() {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('CopyButton', () => {
  it('copies the value, and names itself with the label when only the icon shows', async () => {
    writeText.mockClear()
    const user = userEvent.setup()
    stubClipboard()
    renderWithProviders(<CopyButton value="REQ-001" label="Copy the key" />)

    await user.click(screen.getByRole('button', { name: 'Copy the key' }))

    expect(writeText).toHaveBeenCalledWith('REQ-001')
  })

  it('says through its words that it copied, in the display that has them', async () => {
    writeText.mockClear()
    const user = userEvent.setup()
    stubClipboard()
    renderWithProviders(<CopyButton value="REQ-001" display="icon-text" />)

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('shows the label in a tooltip when only the icon shows', async () => {
    writeText.mockClear()
    const user = userEvent.setup()
    stubClipboard()
    renderWithProviders(<CopyButton value="REQ-001" label="Copy the key" />)

    await user.hover(screen.getByRole('button', { name: 'Copy the key' }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Copy the key')
  })

  it('does not say that it copied when the clipboard refuses', async () => {
    writeText.mockClear()
    writeText.mockRejectedValueOnce(new Error('no permission'))
    const user = userEvent.setup()
    stubClipboard()
    renderWithProviders(<CopyButton value="REQ-001" display="icon-text" />)

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
  })
})
