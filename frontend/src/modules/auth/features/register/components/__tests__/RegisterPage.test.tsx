import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { emptyResponse } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { holdResponse, serverErrorOn } from '@/test/msw'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectAlert,
  expectDisabled,
  expectInvalidField,
  expectLabel,
  expectNoAccessibilityViolations,
  expectReplacedWith,
  expectText,
  fillFields,
  pressButton,
  spyOnToast,
} from '@/test/steps'
import { itAsksForFieldsBeforeSending } from '@/test/suites'

import { RegisterPage } from '../RegisterPage'
import { failedRegisterCases, missingFieldCases, returnCases } from './RegisterPage.data'

async function fillForm() {
  await fillFields({ Name: 'An Tran', Email: 'an@example.com', Password: 'secret' })
  await pressButton('Register')
}

describe('RegisterPage', () => {
  it('has nothing that assistive technology cannot read', async () => {
    const { container } = renderWithProviders(<RegisterPage next={null} />)

    await expectNoAccessibilityViolations(container)
  })

  it.each(returnCases)(
    'creates the account, logs in with it, and opens $opens for $next',
    async ({ next, opens }) => {
      const requests: string[] = []
      server.events.on('request:start', ({ request }) => {
        requests.push(`${request.method} ${new URL(request.url).pathname}`)
      })
      renderWithProviders(<RegisterPage next={next} />)

      await fillForm()

      await expectReplacedWith(opens)
      expect(requests).toEqual([
        `POST ${apiEndpoints.register.path()}`,
        `POST ${apiEndpoints.login.path()}`,
      ])
    },
  )

  it('opens the login page when logging in with the new account fails', async () => {
    server.use(serverErrorOn(HttpMethod.Post, apiEndpoints.login.path()))
    renderWithProviders(<RegisterPage next="/threads/t1" />)

    const infoToast = spyOnToast('info')
    await fillForm()

    await expectReplacedWith('/login?next=%2Fthreads%2Ft1')
    expect(infoToast).toHaveBeenCalledWith('The account is created. Log in with it.')
  })

  it('shows a field problem of the API at its field', async () => {
    server.use(
      http.post(apiEndpoints.register.pattern, () =>
        HttpResponse.json(
          {
            status: HttpStatus.UnprocessableContent,
            code: 'validation_failed',
            errors: [{ field: 'email', message: 'An account with this email exists.' }],
          },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    )
    renderWithProviders(<RegisterPage next={null} />)

    await fillForm()

    await expectText('An account with this email exists.')
    expectInvalidField('Email')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it.each(failedRegisterCases)('shows $name under the form', async ({ answer, alert }) => {
    server.use(http.post(apiEndpoints.register.pattern, answer))
    renderWithProviders(<RegisterPage next={null} />)

    await fillForm()

    await expectAlert(alert)
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  itAsksForFieldsBeforeSending({
    renderForm: () => renderWithProviders(<RegisterPage next={null} />),
    submitLabel: 'Register',
    cases: missingFieldCases,
  })

  it('links to the login page, keeping the page to return to', () => {
    renderWithProviders(<RegisterPage next="/threads/t1" />)

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fthreads%2Ft1',
    )
  })

  it('disables the button while the account is created', async () => {
    const { held, release } = holdResponse()
    server.use(
      http.post(apiEndpoints.register.pattern, async () => {
        await held
        return emptyResponse(HttpStatus.Created)
      }),
    )
    renderWithProviders(<RegisterPage next={null} />)

    await fillForm()

    await expectLabel('Creating the account')
    expectDisabled('button', /Register/)
    release()
    await expectReplacedWith('/')
  })
})
