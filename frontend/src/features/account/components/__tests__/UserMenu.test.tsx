import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiUrl } from '@/shared/api/api-url.utils'
import type * as authRedirect from '@/shared/api/auth-redirect.utils'
import { TestProviders } from '@/test/TestProviders'

import { UserMenu } from '../UserMenu'

const { openPage } = vi.hoisted(() => ({ openPage: vi.fn() }))

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)
vi.mock('@/shared/api/auth-redirect.utils', async (importOriginal) => ({
  ...(await importOriginal<typeof authRedirect>()),
  openPage,
}))

beforeEach(() => {
  openPage.mockClear()
})

describe('UserMenu', () => {
  it('shows the signed-in user', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Account of Linh Pham' }))

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Linh Pham')
    expect(menu).toHaveTextContent('linh.pham@example.com')
  })

  it('signs out and loads the sign-in page', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Account of Linh Pham' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    await vi.waitFor(() => {
      expect(openPage).toHaveBeenCalledWith('/login')
    })
    expect(openPage).toHaveBeenCalledTimes(1)
    expect((await fetch(apiUrl('/api/v1/me'))).status).toBe(401)
  })

  it('offers to load the account again when it fails', async () => {
    server.use(http.get('/api/v1/me', () => new HttpResponse(null, { status: 500 })))
    render(<UserMenu />, { wrapper: TestProviders })

    await userEvent.click(screen.getByRole('button', { name: 'Account' }))

    expect(
      await screen.findByRole('menuitem', { name: 'Failed to load your account. Try again' }),
    ).toBeInTheDocument()
  })
})
