import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { ThemeProvider, useTheme } from 'next-themes'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { mockUserSettings } from '@/mocks/account/me.fixtures'
import { server } from '@/mocks/msw-server.setup'
import { TestProviders } from '@/test/TestProviders'

import { ThemeSync } from '../ThemeSync'

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TestProviders>{children}</TestProviders>
    </ThemeProvider>
  )
}

function LightButton() {
  const { setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => {
        setTheme('light')
      }}
    >
      Light
    </button>
  )
}

describe('ThemeSync', () => {
  it('takes the theme of the user settings', async () => {
    server.use(
      http.get('/api/v1/me/settings', () =>
        HttpResponse.json({ ...mockUserSettings, theme: 'light' }),
      ),
    )
    render(<ThemeSync />, { wrapper: Providers })

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('light')
    })
  })

  it('saves a theme chosen on the page', async () => {
    let saved: unknown
    server.use(
      http.put('/api/v1/me/settings', async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json({ ...mockUserSettings, theme: 'light' })
      }),
    )
    const { getByRole } = render(
      <>
        <ThemeSync />
        <LightButton />
      </>,
      { wrapper: Providers },
    )
    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark')
    })

    await userEvent.click(getByRole('button', { name: 'Light' }))

    await waitFor(() => {
      expect(saved).toMatchObject({ theme: 'light', default_output_language: 'en' })
    })
    expect(saved).not.toHaveProperty('user_id')
  })
})
