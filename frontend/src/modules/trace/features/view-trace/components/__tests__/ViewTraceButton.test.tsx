import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations } from '@/test/steps'

import { ViewTraceButton } from '../ViewTraceButton'

const projectId = projectIds.mentor

describe('ViewTraceButton', () => {
  it('is an icon button named by what it does', () => {
    renderWithProviders(<ViewTraceButton projectId={projectId} itemId="item-1" title="Search" />)

    expect(screen.getByRole('button', { name: 'View its trace' })).toHaveTextContent('')
  })

  it('shows the trace of the item it is given', async () => {
    const user = userEvent.setup()
    routerMock.push.mockClear()
    renderWithProviders(<ViewTraceButton projectId={projectId} itemId="subject-1" />)

    await user.click(screen.getByRole('button', { name: 'View its trace' }))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(
        expect.stringContaining('/trace/items/subject-1'),
      )
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ViewTraceButton projectId={projectId} itemId="item-1" title="Search" />,
    )

    await expectNoAccessibilityViolations(container)
  })
})
