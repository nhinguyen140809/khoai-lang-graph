import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link2Icon, Unlink2Icon } from 'lucide-react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../dropdown-menu'
import {
  ActionIconButton,
  ContextActionItem,
  DropdownActionItem,
  type MenuAction,
} from '../menu-action'

const linkAction: MenuAction = {
  icon: Link2Icon,
  label: 'Link to another item',
  disabledReason: null,
  run: () => undefined,
}

function renderDropdownItem(props: Partial<MenuAction> = {}) {
  return renderWithProviders(
    <DropdownMenu open>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownActionItem
          icon={linkAction.icon}
          label={linkAction.label}
          disabledReason={props.disabledReason ?? null}
          tone={props.tone}
          onSelect={() => undefined}
        />
      </DropdownMenuContent>
    </DropdownMenu>,
  )
}

describe('DropdownActionItem', () => {
  it('shows the icon and the words of the action', () => {
    renderDropdownItem()

    expect(screen.getByRole('menuitem', { name: 'Link to another item' })).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Link to another item' }).querySelector('svg'),
    ).not.toBeNull()
  })

  it('runs what the action names when chosen', async () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownActionItem
            icon={Link2Icon}
            label="Link to another item"
            disabledReason={null}
            onSelect={onSelect}
          />
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    await userEvent.setup().click(screen.getByRole('menuitem', { name: 'Link to another item' }))

    expect(onSelect).toHaveBeenCalled()
  })

  it('sits disabled with the reason it is given', () => {
    renderDropdownItem({ disabledReason: 'Only the documents under review can change now.' })

    expect(screen.getByRole('menuitem', { name: 'Link to another item' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('takes the destructive look', () => {
    renderWithProviders(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownActionItem
            icon={Unlink2Icon}
            label="Remove this link"
            disabledReason={null}
            tone="destructive"
            onSelect={() => undefined}
          />
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    expect(
      screen.getByRole('menuitem', { name: 'Remove this link' }).closest('[data-variant]'),
    ).toHaveAttribute('data-variant', 'destructive')
  })
})

describe('ContextActionItem', () => {
  it('shows the icon and the words of the action in a context menu', () => {
    renderWithProviders(
      <ContextMenu open>
        <ContextMenuTrigger>Node</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextActionItem
            icon={Link2Icon}
            label="Link to another item"
            disabledReason={null}
            onSelect={() => undefined}
          />
        </ContextMenuContent>
      </ContextMenu>,
    )

    expect(screen.getByRole('menuitem', { name: 'Link to another item' })).toBeInTheDocument()
  })
})

describe('ActionIconButton', () => {
  it('names the button by the words of the action, with the icon only', () => {
    renderWithProviders(<ActionIconButton action={linkAction} />)

    const button = screen.getByRole('button', { name: 'Link to another item' })
    expect(button).toHaveTextContent('')
    expect(button).toBeEnabled()
  })

  it('says the words of the action in its tooltip', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ActionIconButton action={linkAction} />)

    await user.hover(screen.getByRole('button', { name: 'Link to another item' }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Link to another item')
  })

  it('runs the action when it is pressed', async () => {
    const user = userEvent.setup()
    const run = vi.fn()
    renderWithProviders(<ActionIconButton action={{ ...linkAction, run }} />)

    await user.click(screen.getByRole('button', { name: 'Link to another item' }))

    expect(run).toHaveBeenCalledTimes(1)
  })

  it('is disabled while the action cannot run, and gives the reason in the tooltip of its wrapper', async () => {
    const user = userEvent.setup()
    const run = vi.fn()
    renderWithProviders(
      <ActionIconButton
        action={{ ...linkAction, run, disabledReason: 'Only a document under review can change.' }}
      />,
    )

    const button = screen.getByRole('button', { name: 'Link to another item' })
    await user.click(button)
    await user.hover(assertPresent(button.parentElement, 'The disabled button has no wrapper'))

    expect(button).toBeDisabled()
    expect(run).not.toHaveBeenCalled()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Only a document under review can change.',
    )
  })

  it('hands its button to the ref it is given, in the size it is given', () => {
    const ref = createRef<HTMLButtonElement>()
    renderWithProviders(<ActionIconButton action={linkAction} size="icon" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Link to another item' }))
  })
})
