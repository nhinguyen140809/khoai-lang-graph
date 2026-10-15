import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { RegisterPage } from '../RegisterPage'
import { failedRegisterCases, missingFieldCases, returnCases } from './RegisterPage.data'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  routerMock.replace.mockClear()
})

afterEach(() => {
  server.events.removeAllListeners()
})

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Name'), 'An Tran')
  await userEvent.type(screen.getByLabelText('Email'), 'an@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  it.each(returnCases)(
    'creates the account, signs in with it, and opens $opens for $next',
    async ({ next, opens }) => {
      const requests: string[] = []
      server.events.on('request:start', ({ request }) => {
        requests.push(`${request.method} ${new URL(request.url).pathname}`)
      })
      render(<RegisterPage next={next} />, { wrapper: TestProviders })

      await fillForm()

      await vi.waitFor(() => {
        expect(routerMock.replace).toHaveBeenCalledWith(opens)
      })
      expect(requests).toEqual(['POST /api/v1/auth/register', 'POST /api/v1/auth/login'])
    },
  )

  it('opens the sign-in page when signing in with the new account fails', async () => {
    server.use(http.post('/api/v1/auth/login', () => new HttpResponse(null, { status: 500 })))
    render(<RegisterPage next="/threads/t1" />, { wrapper: TestProviders })

    const info = vi.spyOn(toast, 'info')
    await fillForm()

    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/login?next=%2Fthreads%2Ft1')
    })
    expect(info).toHaveBeenCalledWith('The account is created. Sign in with it.')
    info.mockRestore()
  })

  it('shows a field problem of the API at its field', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json(
          {
            status: 422,
            code: 'validation_failed',
            errors: [{ field: 'email', message: 'An account with this email exists.' }],
          },
          { status: 422 },
        ),
      ),
    )
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await fillForm()

    expect(await screen.findByText('An account with this email exists.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it.each(failedRegisterCases)('shows $name under the form', async ({ answer, alert }) => {
    server.use(http.post('/api/v1/auth/register', answer))
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(alert)
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it.each(missingFieldCases)('asks for $name before sending', async ({ typed, messages }) => {
    const requests: string[] = []
    server.events.on('request:start', ({ request }) => {
      requests.push(request.url)
    })
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    for (const [label, value] of Object.entries(typed)) {
      await userEvent.type(screen.getByLabelText(label), value)
    }
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    for (const message of messages) expect(await screen.findByText(message)).toBeInTheDocument()
    expect(requests).toEqual([])
  })

  it('links to the sign-in page, keeping the page to return to', () => {
    render(<RegisterPage next="/threads/t1" />, { wrapper: TestProviders })

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fthreads%2Ft1',
    )
  })

  it('disables the button while the account is created', async () => {
    let answer: (() => void) | undefined
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    server.use(
      http.post('/api/v1/auth/register', async () => {
        await answered
        return new HttpResponse(null, { status: 201 })
      }),
    )
    render(<RegisterPage next={null} />, { wrapper: TestProviders })

    await fillForm()

    expect(await screen.findByLabelText('Creating the account')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create account/ })).toBeDisabled()
    answer?.()
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/')
    })
  })
})
