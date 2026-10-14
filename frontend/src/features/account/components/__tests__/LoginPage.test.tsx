import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { LoginPage } from '../LoginPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  routerMock.replace.mockClear()
})

async function signIn(email: string, password: string) {
  await userEvent.type(screen.getByLabelText('Email'), email)
  await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('LoginPage', () => {
  it('signs in and returns to the page that asked for it', async () => {
    render(<LoginPage next="/projects/p1/console" />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/projects/p1/console')
    })
  })

  it('goes to the project list when the page to return to is another site', async () => {
    render(<LoginPage next="https://example.com" />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/projects')
    })
  })

  it('says when the email or the password is wrong', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ status: 401, code: 'unauthenticated' }, { status: 401 }),
      ),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or the password is wrong.',
    )
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('asks for the email and the password', async () => {
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
  })

  it('links to the account page, keeping the page to return to', () => {
    render(<LoginPage next="/projects/p1/console" />, { wrapper: TestProviders })

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/register?next=%2Fprojects%2Fp1%2Fconsole',
    )
  })
  it('says to wait after too many attempts', async () => {
    server.use(http.post('/api/v1/auth/login', () => new HttpResponse(null, { status: 429 })))
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Wait a moment, then try again.',
    )
  })

  it('shows another failure with its message', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ status: 503, detail: 'Down for maintenance.' }, { status: 503 }),
      ),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to sign in (HTTP 503): Down for maintenance.',
    )
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('shows a failure of the network', async () => {
    server.use(http.post('/api/v1/auth/login', () => HttpResponse.error()))
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect((await screen.findByRole('alert')).textContent).not.toBe('')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('sends the email without the spaces around it', async () => {
    let sent: unknown = null
    server.use(
      http.post('/api/v1/auth/login', async ({ request }) => {
        sent = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('  linh.pham@example.com  ', 'secret')

    await vi.waitFor(() => {
      expect(sent).toEqual({ email: 'linh.pham@example.com', password: 'secret' })
    })
  })

  it('disables the button while signing in', async () => {
    let answer: (() => void) | undefined
    const answered = new Promise<void>((resolve) => {
      answer = resolve
    })
    server.use(
      http.post('/api/v1/auth/login', async () => {
        await answered
        return new HttpResponse(null, { status: 204 })
      }),
    )
    render(<LoginPage next={null} />, { wrapper: TestProviders })

    await signIn('linh.pham@example.com', 'secret')

    expect(await screen.findByLabelText('Signing in')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/ })).toBeDisabled()
    answer?.()
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/projects')
    })
  })
})
