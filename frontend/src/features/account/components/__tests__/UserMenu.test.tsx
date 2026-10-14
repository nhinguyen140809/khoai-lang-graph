import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiUrl } from '@/shared/api/api-url.utils'
import type * as authRedirect from '@/shared/api/auth-redirect.utils'
import { TestProviders } from '@/test/TestProviders'

import { UserMenu } from '../UserMenu'

const { loadPage, setTheme } = vi.hoisted(() => ({ loadPage: vi.fn(), setTheme: vi.fn() }))

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark', setTheme }) }))
vi.mock('@/shared/api/auth-redirect.utils', async (importOriginal) => ({
  ...(await importOriginal<typeof authRedirect>()),
  loadPage,
}))

beforeEach(() => {
  loadPage.mockClear()
  setTheme.mockClear()
})

async function openMenu(name: string | RegExp) {
  await userEvent.click(await screen.findByRole('button', { name }))
}

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
      expect(loadPage).toHaveBeenCalledWith('/login')
    })
    expect(loadPage).toHaveBeenCalledTimes(1)
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

  it('shows that the account is loading', async () => {
    let answer: (() => void) | undefined
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    server.use(
      http.get('/api/v1/me', async () => {
        await answered
        return new HttpResponse(null, { status: 500 })
      }),
    )
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account')

    expect(screen.getByRole('menuitem', { name: 'Loading your account...' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    answer?.()
  })

  it('loads the account again after a failure', async () => {
    server.use(
      http.get('/api/v1/me', () => new HttpResponse(null, { status: 500 }), { once: true }),
    )
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account')
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Failed to load your account. Try again' }),
    )

    expect(await screen.findByRole('button', { name: 'Account of Linh Pham' })).toBeInTheDocument()
  })

  it('links to the settings of the user', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account of Linh Pham')

    expect(screen.getByRole('menuitem', { name: 'Your settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })

  it('marks the theme in use and changes it', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account of Linh Pham')
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Light' }))

    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('says when signing out fails, and stays on the page', async () => {
    server.use(http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 500 })))
    const error = vi.spyOn(toast, 'error')
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account of Linh Pham')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('Failed to sign out (HTTP 500)')
    })
    expect(loadPage).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('shows no failure when the session had already ended', async () => {
    server.use(http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 401 })))
    const error = vi.spyOn(toast, 'error')
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <UserMenu />
      </QueryClientProvider>,
    )

    await openMenu('Account of Linh Pham')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    // The mutation is marked failed only after its own onError has run.
    await vi.waitFor(() => {
      expect(client.getMutationCache().getAll()[0]?.state.status).toBe('error')
    })
    expect(error).not.toHaveBeenCalled()
    expect(loadPage).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
