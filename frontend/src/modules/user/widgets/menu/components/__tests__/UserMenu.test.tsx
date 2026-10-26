import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { apiUrl } from '@/shared/api/request/api-url.utils'
import type * as urlModule from '@/shared/lib/url'
import { TestProviders } from '@/test/render/TestProviders'

import { UserMenu } from '../UserMenu'
import { plannedItems } from './UserMenu.data'

const { reloadTo } = vi.hoisted(() => ({ reloadTo: vi.fn() }))

vi.mock('next/link', async () => (await import('@/test/next-stubs/next-stubs.utils')).linkMock)
vi.mock('@/shared/lib/url', async (importOriginal) => ({
  ...(await importOriginal<typeof urlModule>()),
  reloadTo,
}))

beforeEach(() => {
  reloadTo.mockClear()
})

async function openMenu(name: string | RegExp) {
  await userEvent.click(await screen.findByRole('button', { name }))
}

/** Chooses Sign out in the open menu, then confirms it in the dialog. */
async function confirmLogout() {
  await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Sign out?' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }))
}

describe('UserMenu', () => {
  it('shows the signed-in user', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Linh Pham' }))

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Linh Pham')
    expect(menu).toHaveTextContent('linh.pham@example.com')
  })

  it('signs out and loads the login page', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Linh Pham' }))
    await confirmLogout()

    await vi.waitFor(() => {
      expect(reloadTo).toHaveBeenCalledWith('/login')
    })
    expect(reloadTo).toHaveBeenCalledTimes(1)
    expect((await fetch(apiUrl(apiEndpoints.me.path()))).status).toBe(401)
  })

  it('offers to load the account again when it fails', async () => {
    server.use(http.get(apiEndpoints.me.path(), () => new HttpResponse(null, { status: 500 })))
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
      http.get(apiEndpoints.me.pattern, async () => {
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
    // Opening the menu loads the account again too, so the server fails until the user retries.
    let failing = true
    server.use(
      http.get('/api/v1/me', () => (failing ? new HttpResponse(null, { status: 500 }) : undefined)),
    )
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Account')
    const retry = await screen.findByRole('menuitem', {
      name: 'Failed to load your account. Try again',
    })
    failing = false
    await userEvent.click(retry)

    expect(await screen.findByRole('button', { name: 'Linh Pham' })).toBeInTheDocument()
  })

  it('opens the profile from the user at the top of the menu', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Linh Pham')

    expect(
      screen.getByRole('menuitem', { name: 'Your profile: Linh Pham linh.pham@example.com' }),
    ).toHaveAttribute('href', '/settings')
  })

  it.each(plannedItems)('offers %s disabled until it exists', async (item) => {
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Linh Pham')

    expect(screen.getByRole('menuitem', { name: item })).toHaveAttribute('aria-disabled', 'true')
  })

  it('asks before logging out, and keeps the session when cancelled', async () => {
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Linh Pham')
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Sign out?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(reloadTo).not.toHaveBeenCalled()
    expect((await fetch(apiUrl(apiEndpoints.me.path()))).status).toBe(200)
  })

  it('says when logging out fails, and stays on the page', async () => {
    server.use(http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 500 })))
    const error = vi.spyOn(toast, 'error')
    render(<UserMenu />, { wrapper: TestProviders })

    await openMenu('Linh Pham')
    await confirmLogout()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('Failed to sign out (HTTP 500)')
    })
    expect(reloadTo).not.toHaveBeenCalled()
    // The dialog stays, so that the user can try again or cancel.
    expect(screen.getByRole('alertdialog', { name: 'Sign out?' })).toBeInTheDocument()
    error.mockRestore()
  })

  it('shows no failure when the session had already ended', async () => {
    server.use(
      http.post(apiEndpoints.logout.pattern, () => new HttpResponse(null, { status: 401 })),
    )
    const error = vi.spyOn(toast, 'error')
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <UserMenu />
      </QueryClientProvider>,
    )

    await openMenu('Linh Pham')
    await confirmLogout()

    // The mutation is marked failed only after its own onError has run.
    await vi.waitFor(() => {
      expect(client.getMutationCache().getAll()[0]?.state.status).toBe('error')
    })
    expect(error).not.toHaveBeenCalled()
    expect(reloadTo).not.toHaveBeenCalled()
    error.mockRestore()
  })
})
