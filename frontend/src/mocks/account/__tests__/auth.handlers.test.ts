import { afterEach, describe, expect, it } from 'vitest'

import { apiUrl } from '@/shared/api/api-url.utils'

const post = (path: string, body?: unknown) =>
  fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })

// A scenario of the mocks is chosen in the page address.
function openPage(address: string) {
  window.history.replaceState(null, '', address)
}

afterEach(() => {
  openPage('/')
})

describe('auth handlers', () => {
  it('answers 401 after signing out, until the user signs in again', async () => {
    expect((await fetch(apiUrl('/api/v1/me'))).status).toBe(200)

    expect((await post('/api/v1/auth/logout')).status).toBe(204)
    const signedOut = await fetch(apiUrl('/api/v1/projects'))
    expect(signedOut.status).toBe(401)
    expect(await signedOut.json()).toMatchObject({ code: 'unauthenticated' })

    expect(
      (await post('/api/v1/auth/login', { email: 'linh.pham@example.com', password: 'secret' }))
        .status,
    ).toBe(204)
    expect((await fetch(apiUrl('/api/v1/projects'))).status).toBe(200)
  })

  it('answers 401 to signing out without a session', async () => {
    expect((await post('/api/v1/auth/logout')).status).toBe(204)

    expect((await post('/api/v1/auth/logout')).status).toBe(401)
  })

  it('creates an account that GET /me then returns', async () => {
    const created = await post('/api/v1/auth/register', {
      email: 'An@Example.com',
      password: 'secret',
      display_name: 'An Tran',
    })

    expect(created.status).toBe(201)
    expect(await (await fetch(apiUrl('/api/v1/me'))).json()).toMatchObject({
      email: 'an@example.com',
      display_name: 'An Tran',
    })
  })

  it('asks for the missing fields', async () => {
    const answer = await post('/api/v1/auth/login', { email: '' })

    expect(answer.status).toBe(422)
    expect(await answer.json()).toMatchObject({
      errors: [
        { field: 'email', message: 'Enter a value.' },
        { field: 'password', message: 'Enter a value.' },
      ],
    })
  })

  it('answers a refused sign-in in the login scenario', async () => {
    openPage('/login?mock-login=error')

    const answer = await post('/api/v1/auth/login', { email: 'a@example.com', password: 'x' })

    expect(answer.status).toBe(401)
    expect(await answer.json()).toMatchObject({
      code: 'unauthenticated',
      detail: 'The email or the password is wrong.',
    })
  })

  it('answers that the email has an account in the register scenario', async () => {
    openPage('/register?mock-register=error')

    const answer = await post('/api/v1/auth/register', {
      email: 'a@example.com',
      password: 'x',
      display_name: 'A',
    })

    expect(answer.status).toBe(422)
    expect(await answer.json()).toMatchObject({
      errors: [{ field: 'email', message: 'An account with this email exists.' }],
    })
  })

  it('answers a new account with its address, the email in lower case and the name trimmed', async () => {
    const created = await post('/api/v1/auth/register', {
      email: 'An@Example.com',
      password: 'secret',
      display_name: '  An Tran  ',
    })

    expect(created.status).toBe(201)
    expect(created.headers.get('Location')).toBe('/api/v1/me')
    expect(await created.json()).toMatchObject({ email: 'an@example.com', display_name: 'An Tran' })
  })

  it('asks for the three fields of an account', async () => {
    const answer = await post('/api/v1/auth/register', { email: ' ', display_name: 3 })

    expect(answer.status).toBe(422)
    expect(await answer.json()).toMatchObject({
      errors: [
        { field: 'email', message: 'Enter a value.' },
        { field: 'password', message: 'Enter a value.' },
        { field: 'display_name', message: 'Enter a value.' },
      ],
    })
  })

  it('answers a body that is not JSON as a body without fields', async () => {
    const answer = await fetch(apiUrl('/api/v1/auth/login'), { method: 'POST', body: 'not json' })

    expect(answer.status).toBe(422)
  })

  it('lets creating an account and signing in through without a session', async () => {
    await post('/api/v1/auth/logout')

    expect(
      (
        await post('/api/v1/auth/register', {
          email: 'an@example.com',
          password: 'secret',
          display_name: 'An',
        })
      ).status,
    ).toBe(201)
    expect(
      (await post('/api/v1/auth/login', { email: 'an@example.com', password: 'secret' })).status,
    ).toBe(204)
  })

  it('leaves health, and any request without a mock, to the network', async () => {
    await expect(fetch(apiUrl('/api/v1/no-mock'))).rejects.toThrow()

    await post('/api/v1/auth/logout')
    await expect(fetch(apiUrl('/api/v1/health'))).rejects.toThrow()
  })
})
