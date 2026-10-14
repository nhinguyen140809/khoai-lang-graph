import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArchiveIcon } from 'lucide-react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../button'
import { ConfirmDialog } from '../confirm-dialog'

function renderWithTrigger(onConfirm: () => unknown) {
  render(
    <ConfirmDialog
      trigger={<Button>Delete</Button>}
      title="Delete the item?"
      description="It cannot be restored."
      confirmLabel="Delete"
      destructive
      onConfirm={onConfirm}
    />,
  )
}

async function openAndConfirm() {
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Delete the item?' })
  expect(dialog).toHaveAccessibleDescription('It cannot be restored.')
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
}

describe('ConfirmDialog', () => {
  it('starts on the button that cancels, and cancels without the action', async () => {
    const onConfirm = vi.fn()
    renderWithTrigger(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('runs the action and closes', async () => {
    const onConfirm = vi.fn()
    renderWithTrigger(onConfirm)

    await openAndConfirm()

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('waits for an action that returns a promise, and closes when it resolves', async () => {
    let finish: (() => void) | undefined
    renderWithTrigger(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )

    await openAndConfirm()

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    finish?.()
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('stays open when the action fails, so that the user can try again or cancel', async () => {
    renderWithTrigger(() => Promise.reject(new Error('Failed')))

    await openAndConfirm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('opens from elsewhere through open, and says when it closes', async () => {
    const onOpenChange = vi.fn()
    function Opener() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button
            onClick={() => {
              setOpen(true)
            }}
          >
            Open
          </Button>
          <ConfirmDialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next)
              onOpenChange(next)
            }}
            title="Sign out?"
            confirmLabel="Sign out"
            onConfirm={vi.fn()}
          />
        </>
      )
    }
    render(<Opener />)

    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows a warning sign for a destructive action, the icon given, or none', async () => {
    const icon = () => document.querySelector('[data-slot="alert-dialog-media"] svg')
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Delete the item?"
        confirmLabel="Delete"
        destructive
        onConfirm={vi.fn()}
      />,
    )
    await screen.findByRole('alertdialog')
    expect(icon()).toHaveClass('lucide-triangle-alert')

    rerender(
      <ConfirmDialog
        open
        title="Archive the project?"
        confirmLabel="Archive"
        icon={<ArchiveIcon />}
        onConfirm={vi.fn()}
      />,
    )
    expect(icon()).toHaveClass('lucide-archive')

    rerender(
      <ConfirmDialog
        open
        title="Delete the item?"
        confirmLabel="Delete"
        destructive
        icon={null}
        onConfirm={vi.fn()}
      />,
    )
    expect(icon()).toBeNull()
  })
})
