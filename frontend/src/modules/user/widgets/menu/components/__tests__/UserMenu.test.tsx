import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { emptyResponse, noContent } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import type * as urlModule from '@/shared/lib/url'
import { fetchApi, holdResponse, serverError, serverErrorOn } from '@/test/msw'
import { createTestQueryClient, renderWithProviders } from '@/test/render'
import {
  cancelAction,
  confirmAction,
  expectAttribute,
  expectNoConfirmDialog,
  expectRole,
  findConfirmDialog,
  pressButton,
  pressMenuItem,
  spyOnToast,
  waitForCall,
} from '@/test/steps'
import { itAsksBeforeAction } from '@/test/suites'

import { UserMenu } from '../UserMenu'
import { plannedItems } from './UserMenu.data'

const { reloadTo } = vi.hoisted(() => ({ reloadTo: vi.fn() }))

vi.mock('@/shared/lib/url', async (importOriginal) => ({
  ...(await importOriginal<typeof urlModule>()),
  reloadTo,
}))

/** Chooses Log out in the open menu, then confirms it in the dialog. */
async function confirmLogout() {
  await pressMenuItem('Log out')
  const dialog = await findConfirmDialog('Log out?')
  await confirmAction(dialog, 'Log out')
}

describe('UserMenu', () => {
  it('shows the signed-in user', async () => {
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('Linh Pham')
    expect(menu).toHaveTextContent('linh.pham@example.com')
  })

  it('logs out and loads the login page', async () => {
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')
    await confirmLogout()

    await waitForCall(reloadTo, '/login')
    expect(reloadTo).toHaveBeenCalledTimes(1)
    expect((await fetchApi(apiEndpoints.me.path())).status).toBe(HttpStatus.Unauthorized)
  })

  it('offers to load the account again when it fails', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.me.path()))
    renderWithProviders(<UserMenu />)

    await pressButton('Account')

    expect(
      await screen.findByRole('menuitem', { name: 'Failed to load your account. Try again' }),
    ).toBeInTheDocument()
  })

  it('shows that the account is loading', async () => {
    const { held, release } = holdResponse()
    server.use(
      http.get(apiEndpoints.me.pattern, async () => {
        await held
        return serverError()
      }),
    )
    renderWithProviders(<UserMenu />)

    await pressButton('Account')

    expectAttribute('menuitem', 'Loading your account...', 'aria-disabled', 'true')
    release()
  })

  it('loads the account again after a failure', async () => {
    // Opening the menu loads the account again too, so the server fails until the user retries.
    let isFailing = true
    server.use(http.get(apiEndpoints.me.pattern, () => (isFailing ? serverError() : undefined)))
    renderWithProviders(<UserMenu />)

    await pressButton('Account')
    const retry = await screen.findByRole('menuitem', {
      name: 'Failed to load your account. Try again',
    })
    isFailing = false
    await userEvent.click(retry)

    await expectRole('button', 'Linh Pham')
  })

  it('opens the profile from the user at the top of the menu', async () => {
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')

    expect(
      screen.getByRole('menuitem', { name: 'Your profile: Linh Pham linh.pham@example.com' }),
    ).toHaveAttribute('href', '/settings')
  })

  it.each(plannedItems)('offers %s disabled until it exists', async (item) => {
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')

    expectAttribute('menuitem', item, 'aria-disabled', 'true')
  })

  it('keeps the session when logging out is cancelled', async () => {
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')
    await pressMenuItem('Log out')
    const dialog = await findConfirmDialog('Log out?')

    await cancelAction(dialog)

    await expectNoConfirmDialog()
    expect(reloadTo).not.toHaveBeenCalled()
    expect((await fetchApi(apiEndpoints.me.path())).status).toBe(HttpStatus.Ok)
  })

  describe('Log out', () => {
    let isRequested = false

    itAsksBeforeAction({
      action: 'logging out',
      confirmLabel: 'Log out',
      hasRun: () => isRequested,
      open: async () => {
        isRequested = false
        server.use(
          http.post(apiEndpoints.logout.pattern, () => {
            isRequested = true
            return noContent()
          }),
        )
        renderWithProviders(<UserMenu />)
        await pressButton('Linh Pham')
        await pressMenuItem('Log out')
        return findConfirmDialog('Log out?')
      },
      fail: () => {
        server.use(
          http.post(apiEndpoints.logout.pattern, () => {
            isRequested = true
            return serverError()
          }),
        )
      },
    })
  })

  it('says when logging out fails, and stays on the page', async () => {
    server.use(serverErrorOn(HttpMethod.Post, apiEndpoints.logout.path()))
    const error = spyOnToast('error')
    renderWithProviders(<UserMenu />)

    await pressButton('Linh Pham')
    await confirmLogout()

    await waitForCall(error, 'Failed to log out (HTTP 500)')
    expect(reloadTo).not.toHaveBeenCalled()
    // The dialog stays, so that the user can try again or cancel.
    expect(await findConfirmDialog('Log out?')).toBeInTheDocument()
  })

  it('shows no failure when the session had already ended', async () => {
    server.use(http.post(apiEndpoints.logout.pattern, () => emptyResponse(HttpStatus.Unauthorized)))
    const error = spyOnToast('error')
    const client = createTestQueryClient()
    renderWithProviders(<UserMenu />, { queryClient: client })

    await pressButton('Linh Pham')
    await confirmLogout()

    // The mutation is marked failed only after its own onError has run.
    await vi.waitFor(() => {
      expect(client.getMutationCache().getAll()[0]?.state.status).toBe('error')
    })
    expect(error).not.toHaveBeenCalled()
    expect(reloadTo).not.toHaveBeenCalled()
  })
})
