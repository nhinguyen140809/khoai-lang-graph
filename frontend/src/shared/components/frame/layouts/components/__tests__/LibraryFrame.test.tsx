import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { browserStorage } from '@/shared/lib/storage'
import { routeOfAddress } from '@/shared/routes'
import { expectRole, hoverOver, press, pressButton, pressKeys } from '@/test/steps'

import { DeskBarItem } from '../../../bars/components/DeskBarItem'
import { DeskBarSide } from '../../../bars/desk-bar.types'
import { useDeskTool } from '../../../bars/hooks/useDeskTool'
import { useSidebarStore } from '../../../sidebar/sidebar.store'
import { LibraryFrame } from '../LibraryFrame'

const STORAGE_KEY = useSidebarStore.persist.getOptions().name ?? ''

/** The desk with a page; `withBarItems` has the page place a name at the left of the bar and a button at its right. */
function renderFrame({ withBarItems = true } = {}) {
  render(
    <TooltipProvider>
      <LibraryFrame
        homeHref={routeOfAddress('/')}
        sidebar={<nav aria-label="Projects" />}
        accountMenu={null}
        contributions={<div role="dialog" />}
      >
        {withBarItems && (
          <>
            <DeskBarItem side={DeskBarSide.Right}>
              <button type="button">Export</button>
            </DeskBarItem>
            <DeskBarItem side={DeskBarSide.Left}>
              <p>Mentor platform</p>
            </DeskBarItem>
          </>
        )}
        <p>The chat</p>
      </LibraryFrame>
    </TooltipProvider>,
  )
}

/** Offers a tool, as a page does, and renders nothing in place. */
function Tool() {
  useDeskTool({
    id: 'documents',
    label: 'Documents',
    icon: <span />,
    isActive: false,
    onSelect: () => undefined,
  })
  return null
}

/** The bar at the top of the desk. */
function deskBar() {
  const bar = within(screen.getByRole('main')).getByRole('banner')
  const [left, right] = bar.querySelectorAll<HTMLElement>('[data-slot="stack"]')
  if (left === undefined || right === undefined) throw new Error('The bar has no sides')
  return { bar, left, right }
}

/** The side list and the box around the frame, which holds the width of the side list. */
function sidebarParts() {
  const wrapper = document.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]')
  const sidebar = document.querySelector<HTMLElement>('[data-slot="sidebar"]')
  if (wrapper === null || sidebar === null) throw new Error('The frame has no side list')
  return { sidebar, width: wrapper.style.getPropertyValue('--sidebar-width') }
}

/**
 * Drags the edge of the side list, as wide as `startWidth` when the press starts, to each distance
 * from the start in turn, then lets it go; the browser then sends a click, as it does after a press.
 */
function dragEdge(startWidth: number, ...distances: number[]) {
  const edge = screen.getByRole('button', { name: /^Drag/ })
  if (edge.parentElement === null) throw new Error('The edge is outside the side list')
  vi.spyOn(edge.parentElement, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ width: startWidth }),
  )
  fireEvent.pointerDown(edge, { pointerId: 1, button: 0, clientX: startWidth })
  for (const distance of distances) {
    fireEvent.pointerMove(edge, { pointerId: 1, clientX: startWidth + distance })
  }
  fireEvent.pointerUp(edge, { pointerId: 1 })
  fireEvent.click(edge)
}

afterEach(() => {
  useSidebarStore.setState(useSidebarStore.getInitialState())
  browserStorage.removeItem(STORAGE_KEY)
})

describe('LibraryFrame', () => {
  it('shows the side list, the page and what the desk holds besides', async () => {
    renderFrame()

    await expectRole('navigation', 'Projects')
    expect(screen.getByRole('main')).toHaveTextContent('The chat')
    await expectRole('dialog')
  })

  it('shows the items that the page places on each side of its bar', () => {
    renderFrame()

    const { left, right } = deskBar()
    expect(within(left).getByText('Mentor platform')).toBeInTheDocument()
    expect(within(right).getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })

  it('shows the tools of the page as buttons with their names at the right of the bar, before its items', () => {
    render(
      <TooltipProvider>
        <LibraryFrame homeHref={routeOfAddress('/')} sidebar={null} accountMenu={null}>
          <Tool />
          <DeskBarItem side={DeskBarSide.Right}>
            <button type="button">Export</button>
          </DeskBarItem>
        </LibraryFrame>
      </TooltipProvider>,
    )

    const buttons = within(deskBar().right).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['Documents', 'Export'])
  })

  it('has no bar when the page places nothing in it, and keeps the button of the side list', () => {
    renderFrame({ withBarItems: false })

    const main = screen.getByRole('main')
    expect(within(main).queryByRole('banner')).toBeNull()
    // Shown on a phone only, at the top left of the page.
    expect(within(main).getByRole('button', { name: 'Hide the sidebar' })).toBeInTheDocument()
  })

  it('leads to the home page from the name of the app', () => {
    renderFrame()

    expect(screen.getByRole('link', { name: 'khoai' })).toHaveAttribute('href', '/')
  })

  it('folds the side list to its rail and unfolds it again', async () => {
    renderFrame()
    const sidebar = document.querySelector<HTMLElement>('[data-slot="sidebar"]')
    if (sidebar === null) throw new Error('The frame has no side list')

    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    await press(within(sidebar).getByRole('button', { name: 'Hide the sidebar' }))
    expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    expect(sidebar).toHaveAttribute('data-collapsible', 'icon')
    await press(within(sidebar).getByRole('button', { name: 'Show the sidebar' }))
    expect(sidebar).toHaveAttribute('data-state', 'expanded')
  })

  it('folds the side list with the hotkey that the button names in its tooltip', async () => {
    renderFrame()
    const toggle = within(sidebarParts().sidebar).getByRole('button', { name: 'Hide the sidebar' })
    expect(toggle).toHaveAttribute('aria-keyshortcuts', 'Control+B Meta+B')

    await hoverOver(toggle)
    // The browser of the tests is not an Apple device, so the modifier is Ctrl.
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Hide the sidebarCtrlB')
    await pressKeys('{Control>}b{/Control}')

    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'collapsed')
  })

  it('resizes the side list by dragging its edge, and keeps the width', () => {
    renderFrame()
    expect(sidebarParts().width).toBe('256px')

    // A move shorter than a drag leaves the width, and the click after the drag folds nothing.
    dragEdge(256, 3, 44)

    expect(sidebarParts().width).toBe('300px')
    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'expanded')
    expect(useSidebarStore.getState().width).toBe(300)
  })

  it('folds the side list to its rail once dragged past its narrowest width, keeping its width', async () => {
    renderFrame()

    dragEdge(256, -60, -150)

    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'collapsed')
    await pressButton('Drag or click to show the sidebar')
    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'expanded')
    expect(sidebarParts().width).toBe('256px')
  })

  it('opens the side list again when its rail is dragged out, at its narrowest width at least', async () => {
    renderFrame()
    await press(within(sidebarParts().sidebar).getByRole('button', { name: 'Hide the sidebar' }))

    dragEdge(48, 150)

    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'expanded')
    expect(sidebarParts().width).toBe('224px')
  })

  it('opens with the width and the state kept in the browser', () => {
    browserStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { open: false, width: 320 } }))
    renderFrame()

    expect(sidebarParts().sidebar).toHaveAttribute('data-state', 'collapsed')
    expect(sidebarParts().width).toBe('320px')
  })
})
