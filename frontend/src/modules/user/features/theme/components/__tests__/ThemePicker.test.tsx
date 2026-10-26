import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it } from 'vitest'

import { TestProviders } from '@/test/render/TestProviders'

import { ThemePicker } from '../ThemePicker'

describe('ThemePicker', () => {
  it('marks the theme chosen, and chooses another', async () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemePicker />
      </ThemeProvider>,
      { wrapper: TestProviders },
    )

    expect(await screen.findByRole('button', { name: 'System', pressed: true })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(screen.getByRole('button', { name: 'Dark', pressed: true })).toBeVisible()
    expect(screen.getByRole('button', { name: 'System', pressed: false })).toBeVisible()
  })
})
