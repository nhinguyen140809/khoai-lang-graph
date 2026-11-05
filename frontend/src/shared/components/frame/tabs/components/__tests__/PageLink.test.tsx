import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Route } from 'next'
import { describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'

import { useEditorTabsStore } from '../../editor-tabs.store'
import { PageLink } from '../PageLink'

const href = '/projects/p1/items/RAW-001' as Route

function renderLink() {
  renderWithProviders(<PageLink href={href}>A raw requirement</PageLink>)
}

describe('PageLink', () => {
  it('opens the page in the preview tab on a click', async () => {
    renderLink()

    await userEvent.click(screen.getByRole('link', { name: 'A raw requirement' }))

    expect(routerMock.push).toHaveBeenCalledWith(href)
    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
  })

  it('keeps the tab of the page on a double click', async () => {
    renderLink()

    await userEvent.dblClick(screen.getByRole('link', { name: 'A raw requirement' }))

    expect(routerMock.push).toHaveBeenCalledWith(href)
    expect(useEditorTabsStore.getState().pendingOpen).toMatchObject({ href, keep: true })
  })

  it('keeps the usual meaning of a click with Ctrl, and opens nothing', () => {
    renderLink()

    fireEvent.click(screen.getByRole('link', { name: 'A raw requirement' }), { ctrlKey: true })

    expect(routerMock.push).not.toHaveBeenCalled()
    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
  })
})
