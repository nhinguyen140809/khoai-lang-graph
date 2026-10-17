import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useRef, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PaletteCommand } from '../../command.types'
import { useCommandsStore } from '../../commands.store'
import { useCommands } from '../../hooks/useCommands'
import { CommandPalette } from '../CommandPalette'
import { searchCases } from './CommandPalette.data'

function Commands({ commands }: { commands: PaletteCommand[] }) {
  useCommands(commands)
  return null
}

/** A page with a command that puts the focus in its field once the command has run. */
function FocusPage() {
  const target = useRef<HTMLInputElement>(null)
  const [focusTarget, setFocusTarget] = useState(false)
  useEffect(() => {
    if (focusTarget) target.current?.focus()
  }, [focusTarget])
  useCommands([
    {
      id: 'view.go',
      label: 'Go',
      group: 'View',
      run: () => {
        setFocusTarget(true)
      },
    },
  ])
  return (
    <>
      <button type="button">Before</button>
      <input ref={target} aria-label="Target" />
    </>
  )
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

  it('leaves the focus where the command chosen put it', async () => {
    render(
      <>
        <CommandPalette />
        <FocusPage />
      </>,
    )
    screen.getByRole('button', { name: 'Before' }).focus()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    await userEvent.click(await screen.findByRole('option', { name: 'Go' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    // A dialog that closes moves the focus, if it does, in a task after it is gone.
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    expect(screen.getByRole('textbox', { name: 'Target' })).toHaveFocus()
  })

  it.each(searchCases)(
    'filters the commands by their label and their group for $search',
    async ({ search, shown, hidden }) => {
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

      await userEvent.type(screen.getByRole('combobox'), search)

      for (const label of shown) {
        expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
      }
      for (const label of hidden) {
        expect(screen.queryByRole('option', { name: label })).not.toBeInTheDocument()
      }
    },
  )

  it('lists first, and selects, the best match of a search, whatever its group', async () => {
    useCommandsStore.setState({ open: true })
    render(
      <>
        <CommandPalette />
        <Commands
          commands={[
            {
              id: 'projects.open',
              label: 'Open Student club manager',
              group: 'Projects',
              run: vi.fn(),
            },
            { id: 'run.stop', label: 'Stop run', group: 'Run', run: vi.fn() },
          ]}
        />
      </>,
    )

    await userEvent.type(screen.getByRole('combobox'), 'stop')

    const [first] = screen.getAllByRole('option')
    expect(first).toHaveAccessibleName('Stop run')
    await waitFor(() => {
      expect(first).toHaveAttribute('aria-selected', 'true')
    })
  })
})
