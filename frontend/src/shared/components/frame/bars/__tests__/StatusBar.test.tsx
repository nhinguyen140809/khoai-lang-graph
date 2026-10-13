import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StatusBar } from '../StatusBar'

describe('StatusBar', () => {
  it('shows what the screen reports, and the notifications', async () => {
    render(<StatusBar>Run 1: running</StatusBar>)

    expect(screen.getByText('Run 1: running')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('Nothing new.')).toBeInTheDocument()
  })

  it('shows the notifications when the screen reports nothing', () => {
    render(<StatusBar />)

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })
})
