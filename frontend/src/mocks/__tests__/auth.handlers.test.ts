import { describe, expect, it } from 'vitest'

import { apiUrl } from '@/lib/api-url.utils'

const post = (path: string, body?: unknown) =>
  fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
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
})
