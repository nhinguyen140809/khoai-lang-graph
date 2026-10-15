import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../button'
import { ConfirmDialog } from '../confirm-dialog'
import { iconCases } from './confirm-dialog.data'

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

/** The lucide class of the icon over the title, or null without one. */
function shownIcon() {
  const svg = document.querySelector('[data-slot="alert-dialog-media"] svg')
  if (svg === null) return null
  return ['lucide-triangle-alert', 'lucide-archive'].find((name) => svg.classList.contains(name))
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

  it.each(iconCases)('shows $name', async ({ props, icon }) => {
    render(
      <ConfirmDialog
        open
        title="Archive the item?"
        confirmLabel="Archive"
        onConfirm={vi.fn()}
        {...props}
      />,
    )
    await screen.findByRole('alertdialog')

    expect(shownIcon()).toBe(icon)
  })
})
