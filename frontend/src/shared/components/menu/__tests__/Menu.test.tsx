import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { press, pressButton, pressMenuItem } from '@/test/steps'

import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '..'

/** Makes the screen as narrow as a phone. */
function narrowTheScreen() {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

function renderMenu(onRename: () => void) {
  renderWithProviders(
    <Menu>
      <MenuTrigger>
        <button type="button">Actions</button>
      </MenuTrigger>
      <MenuContent title="Actions for Mentor platform">
        <MenuItem onSelect={onRename}>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">Delete</MenuItem>
      </MenuContent>
    </Menu>,
  )
}

describe('Menu', () => {
  it('opens as a menu beside its trigger on a wide screen', async () => {
    const onRename = vi.fn()
    renderMenu(onRename)

    await pressButton('Actions')
    const item = await screen.findByRole('menuitem', { name: 'Rename' })
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull()
    await press(item)

    expect(onRename).toHaveBeenCalledOnce()
  })

  it('opens as a sheet from the foot of the screen on a narrow screen', async () => {
    narrowTheScreen()
    const onRename = vi.fn()
    renderMenu(onRename)

    await pressButton('Actions')
    expect(await screen.findByRole('menu', { name: 'Actions for Mentor platform' })).toBeVisible()
    expect(document.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull()
    await pressMenuItem('Rename')

    expect(onRename).toHaveBeenCalledOnce()
  })
})
