import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  confirmAction,
  expectDisabled,
  expectEnabled,
  expectFocused,
  expectNoAccessibilityViolations,
  expectNoConfirmDialog,
  expectRole,
  findConfirmDialog,
  pressButton,
  pressEscape,
} from '@/test/steps'
import { itAsksBeforeAction } from '@/test/suites'

import { Button } from '../button'
import { ConfirmDialog } from '../confirm-dialog'
import { iconCases } from './confirm-dialog.data'

const TITLE = 'Delete the item?'

function renderWithTrigger(
  onConfirm: () => unknown,
  props: Partial<ComponentProps<typeof ConfirmDialog>> = {},
) {
  render(
    <ConfirmDialog
      trigger={<Button>Delete</Button>}
      title={TITLE}
      description="It cannot be restored."
      confirmLabel="Delete"
      destructive
      onConfirm={onConfirm}
      {...props}
    />,
  )
}

/** Opens the dialog from its trigger and returns it. */
async function openDialog() {
  await pressButton('Delete')
  return findConfirmDialog(TITLE)
}

/** The lucide class of the icon over the title, or null without one. */
function shownIcon() {
  const svg = document.querySelector('[data-slot="alert-dialog-media"] svg')
  if (svg === null) return null
  return ['lucide-triangle-alert', 'lucide-archive'].find((name) => svg.classList.contains(name))
}

describe('ConfirmDialog', () => {
  describe('as an action that asks first', () => {
    let ran = false
    let failing = false

    itAsksBeforeAction({
      action: 'the item',
      confirmLabel: 'Delete',
      hasRun: () => ran,
      opener: () => screen.getByRole('button', { name: 'Delete' }),
      open: () => {
        ran = false
        failing = false
        renderWithTrigger(() => {
          ran = true
          return failing ? Promise.reject(new Error('Failed')) : undefined
        })
        return openDialog()
      },
      fail: () => {
        failing = true
      },
    })
  })

  it('has nothing that assistive technology cannot read', async () => {
    renderWithTrigger(vi.fn())

    await openDialog()

    await expectNoAccessibilityViolations()
  })

  it('starts on the button that cancels, and describes the action', async () => {
    renderWithTrigger(vi.fn())

    const dialog = await openDialog()

    expect(dialog).toHaveAccessibleDescription('It cannot be restored.')
    expectFocused('button', 'Cancel', within(dialog))
  })

  it('waits for an action that returns a promise, and closes when it resolves', async () => {
    let finish: (() => void) | undefined
    renderWithTrigger(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )

    const dialog = await openDialog()

    await confirmAction(dialog, 'Delete')

    await expectRole('alertdialog')
    expectDisabled('button', 'Cancel')
    await pressEscape()
    await expectRole('alertdialog')
    finish?.()
    await expectNoConfirmDialog()
  })

  it('runs the action once when the button is pressed again while it runs', async () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => undefined))
    renderWithTrigger(onConfirm)
    const dialog = await openDialog()
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })

    await userEvent.click(confirm)
    await userEvent.click(confirm)

    expect(confirm).toBeDisabled()
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('can be confirmed again after a failure', async () => {
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce(undefined)
    renderWithTrigger(onConfirm)
    const dialog = await openDialog()
    await confirmAction(dialog, 'Delete')
    await vi.waitFor(() => {
      expectEnabled('button', 'Delete', within(dialog))
    })

    await confirmAction(dialog, 'Delete')

    await expectNoConfirmDialog()
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('says when it has closed', async () => {
    const onClosed = vi.fn()
    renderWithTrigger(vi.fn(), { onClosed })

    const dialog = await openDialog()

    await confirmAction(dialog, 'Delete')

    await vi.waitFor(() => {
      expect(onClosed).toHaveBeenCalledOnce()
    })
  })

  it('is named by its title alone without a description', async () => {
    renderWithTrigger(vi.fn(), { description: undefined })

    const dialog = await openDialog()

    expect(dialog).not.toHaveAttribute('aria-describedby')
  })

  it('shows the label that cancels and the content under the description', async () => {
    renderWithTrigger(vi.fn(), {
      cancelLabel: 'Close',
      children: <p>3 documents go with it.</p>,
    })

    const dialog = await openDialog()

    await expectRole('button', 'Close', within(dialog))
    expect(within(dialog).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(within(dialog).getByText('3 documents go with it.')).toBeInTheDocument()
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
            title="Log out?"
            confirmLabel="Log out"
            onConfirm={vi.fn()}
          />
        </>
      )
    }
    render(<Opener />)

    await pressButton('Open')
    const dialog = await findConfirmDialog('Log out?')

    await confirmAction(dialog, 'Log out')

    expect(onOpenChange).toHaveBeenCalledWith(false)
    await expectNoConfirmDialog()
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
