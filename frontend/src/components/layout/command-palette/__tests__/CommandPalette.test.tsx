import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommandGroup, CommandItem } from '@/components/ui/command'

import { useFrameStore } from '../../frame.store'
import { useCommandPaletteStore } from '../command-palette.store'
import { CommandPalette } from '../CommandPalette'

beforeEach(() => {
  useCommandPaletteStore.setState({ open: false })
  useFrameStore.setState({ sidePanelVisible: true })
})

describe('CommandPalette', () => {
  it('opens with Ctrl+K and shows the commands of the screen', () => {
    render(
      <CommandPalette>
        <CommandGroup heading="Projects">
          <CommandItem>Open Mentor platform</CommandItem>
        </CommandGroup>
      </CommandPalette>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Open Mentor platform' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Toggle side panel/ })).not.toBeInTheDocument()
  })

  it('hides the side panel and closes when that command is chosen', async () => {
    useCommandPaletteStore.setState({ open: true })
    render(<CommandPalette sidePanelCommand />)

    await userEvent.click(screen.getByRole('option', { name: /Toggle side panel/ }))

    expect(useFrameStore.getState().sidePanelVisible).toBe(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('filters the commands by the search text', async () => {
    useCommandPaletteStore.setState({ open: true })
    render(<CommandPalette />)

    await userEvent.type(screen.getByRole('combobox'), 'light')

    expect(screen.getByRole('option', { name: 'Theme: Light' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Theme: Dark' })).not.toBeInTheDocument()
  })
})
