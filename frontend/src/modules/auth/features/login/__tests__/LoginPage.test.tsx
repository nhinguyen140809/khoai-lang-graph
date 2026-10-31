import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { noContent } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { holdResponse } from '@/test/msw'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectAlert,
  expectAttribute,
  expectDisabled,
  expectLabel,
  expectNoAccessibilityViolations,
  expectReplacedWith,
  fillFields,
  pressButton,
} from '@/test/steps'
import { itAsksForFieldsBeforeSending } from '@/test/suites'

import { LoginPage } from '../LoginPage'
import { missingFieldCases, refusedLoginCases, returnCases } from './LoginPage.data'

async function logIn(email: string, password: string) {
  await fillFields({ Email: email, Password: password })
  await pressButton('Log in')
}

describe('LoginPage', () => {
  it.each(returnCases)('logs in and opens $opens for $next', async ({ next, opens }) => {
    renderWithProviders(<LoginPage next={next} />)

    await logIn('linh.pham@example.com', 'secret')

    await expectReplacedWith(opens)
  })

  it.each(refusedLoginCases)('says $name, and stays', async ({ answer, alert }) => {
    server.use(http.post(apiEndpoints.login.pattern, answer))
    renderWithProviders(<LoginPage next={null} />)

    await logIn('linh.pham@example.com', 'secret')

    await expectAlert(alert)
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  itAsksForFieldsBeforeSending({
    renderForm: () => renderWithProviders(<LoginPage next={null} />),
    submitLabel: 'Log in',
    cases: missingFieldCases,
  })

  it('has nothing that assistive technology cannot read', async () => {
    const { container } = renderWithProviders(<LoginPage next={null} />)

    await expectNoAccessibilityViolations(container)
  })

  it('links to the account page, keeping the page to return to', () => {
    renderWithProviders(<LoginPage next="/projects/p1/console" />)

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register?next=%2Fprojects%2Fp1%2Fconsole',
    )
  })

  it('has the place of the link that resets a password, not available yet', () => {
    renderWithProviders(<LoginPage next={null} />)

    expectAttribute('button', 'Forgot password?', 'aria-disabled', 'true')
  })

  it('shows a failure of the network', async () => {
    server.use(http.post(apiEndpoints.login.pattern, () => HttpResponse.error()))
    renderWithProviders(<LoginPage next={null} />)

    await logIn('linh.pham@example.com', 'secret')

    expect((await screen.findByRole('alert')).textContent).not.toBe('')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('sends the email without the spaces around it', async () => {
    let sent: unknown = null
    server.use(
      http.post(apiEndpoints.login.pattern, async ({ request }) => {
        sent = await request.json()
        return noContent()
      }),
    )
    renderWithProviders(<LoginPage next={null} />)

    await logIn('  linh.pham@example.com  ', 'secret')

    await vi.waitFor(() => {
      expect(sent).toEqual({ email: 'linh.pham@example.com', password: 'secret' })
    })
  })

  it('disables the button while logging in', async () => {
    const { held, release } = holdResponse()
    server.use(
      http.post(apiEndpoints.login.pattern, async () => {
        await held
        return noContent()
      }),
    )
    renderWithProviders(<LoginPage next={null} />)

    await logIn('linh.pham@example.com', 'secret')

    await expectLabel('Logging in')
    expectDisabled('button', /Log in/)
    release()
    await expectReplacedWith('/')
  })
})
