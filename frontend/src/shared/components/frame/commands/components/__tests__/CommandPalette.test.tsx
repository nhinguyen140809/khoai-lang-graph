import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PaletteCommand } from '../../command.types'
import { useCommandsStore } from '../../commands.store'
import { useCommands } from '../../hooks/useCommands'
import { CommandPalette } from '../CommandPalette'

function Commands({ commands }: { commands: PaletteCommand[] }) {
  useCommands(commands)
  return null
}

beforeEach(() => {
  useCommandsStore.setState({ open: false })
})

describe('CommandPalette', () => {
  it('opens with Ctrl+K and lists the commands registered, by group', () => {
    render(
      <>
        <CommandPalette />
        <Commands
          commands={[
            { id: 'view.dark', label: 'Theme: Dark', group: 'View', run: vi.fn() },
            { id: 'projects.open', label: 'Open Mentor platform', group: 'Projects', run: vi.fn() },
          ]}
        />
      </>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
    const projects = screen.getByRole('group', { name: 'Projects' })
    const view = screen.getByRole('group', { name: 'View' })
    // The groups are in alphabetical order, whichever registered first.
    expect(projects.compareDocumentPosition(view)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(within(projects).getByRole('option')).toHaveTextContent('Open Mentor platform')
    expect(within(view).getByRole('option', { name: 'Theme: Dark' })).toBeInTheDocument()
    // The palette registers its own command, on the hotkey that opened it.
    expect(within(view).getByRole('option', { name: /Show all commands/ })).toHaveTextContent(
      'Ctrl+K',
    )
  })

  it('closes with Ctrl+K, the hotkey of its own command', () => {
    useCommandsStore.setState({ open: true })
    render(<CommandPalette />)

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('runs the command chosen and closes', async () => {
    const run = vi.fn()
    useCommandsStore.setState({ open: true })
    render(
      <>
        <CommandPalette />
        <Commands commands={[{ id: 'view.dark', label: 'Theme: Dark', group: 'View', run }]} />
      </>,
    )

    await userEvent.click(screen.getByRole('option', { name: 'Theme: Dark' }))

    expect(run).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the hotkey of a command, and a command without run disabled', () => {
    useCommandsStore.setState({ open: true })
    render(
      <>
        <CommandPalette />
        <Commands
          commands={[
            {
              id: 'view.toggle',
              label: 'Toggle side panel',
              group: 'View',
              hotkey: { key: 'b', mod: true },
              run: vi.fn(),
            },
            { id: 'projects.loading', label: 'Loading projects...', group: 'Projects' },
          ]}
        />
      </>,
    )

    expect(screen.getByRole('option', { name: /Toggle side panel/ })).toHaveTextContent('Ctrl+B')
    expect(screen.getByRole('option', { name: 'Loading projects...' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('filters the commands by the search text and by their group', async () => {
    useCommandsStore.setState({ open: true })
    render(
      <>
        <CommandPalette />
        <Commands
          commands={[
            { id: 'view.light', label: 'Theme: Light', group: 'View', run: vi.fn() },
            { id: 'view.dark', label: 'Theme: Dark', group: 'View', run: vi.fn() },
            { id: 'projects.new', label: 'New project', group: 'Projects', run: vi.fn() },
          ]}
        />
      </>,
    )

    await userEvent.type(screen.getByRole('combobox'), 'light')

    expect(screen.getByRole('option', { name: 'Theme: Light' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Theme: Dark' })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByRole('combobox'))
    await userEvent.type(screen.getByRole('combobox'), 'view')

    // The two themes and the command of the palette itself.
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.queryByRole('option', { name: 'New project' })).not.toBeInTheDocument()
  })
})
