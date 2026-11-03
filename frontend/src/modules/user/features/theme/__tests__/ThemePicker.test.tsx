import { screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { pressButton } from '@/test/steps'

import { ThemePicker } from '../ThemePicker'

describe('ThemePicker', () => {
  it('marks the theme chosen, and chooses another', async () => {
    renderWithProviders(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemePicker />
      </ThemeProvider>,
    )

    expect(await screen.findByRole('button', { name: 'System', pressed: true })).toBeVisible()
    await pressButton('Dark')

    expect(screen.getByRole('button', { name: 'Dark', pressed: true })).toBeVisible()
    expect(screen.getByRole('button', { name: 'System', pressed: false })).toBeVisible()
  })
})
