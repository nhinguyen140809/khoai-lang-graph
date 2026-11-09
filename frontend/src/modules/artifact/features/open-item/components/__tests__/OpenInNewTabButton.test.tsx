import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { OpenInNewTabButton } from '../OpenInNewTabButton'

const projectId = projectIds.mentor

describe('OpenInNewTabButton', () => {
  it('is an icon button named by what it does', () => {
    renderWithProviders(<OpenInNewTabButton projectId={projectId} itemId="item-1" title="Search" />)

    const button = screen.getByRole('button', { name: 'Open in a new tab' })
    expect(button).toHaveTextContent('')
  })

  it('opens the page of the item when it is pressed', async () => {
    const user = userEvent.setup()
    routerMock.push.mockClear()
    renderWithProviders(<OpenInNewTabButton projectId={projectId} itemId="item-1" title="Search" />)

    await user.click(screen.getByRole('button', { name: 'Open in a new tab' }))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(expect.stringContaining('/items/item-1'))
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <OpenInNewTabButton projectId={projectId} itemId="item-1" title="Search" />,
    )

    await expectNoAccessibilityViolations(container)
  })
})
