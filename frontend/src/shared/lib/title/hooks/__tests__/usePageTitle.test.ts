import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { usePageTitle } from '../usePageTitle'

describe('usePageTitle', () => {
  it('names the tab after the page while it is on show', () => {
    renderHook(() => {
      usePageTitle('Mentor platform')
    })

    expect(document.title).toBe('Mentor platform | khoailanggraph')
  })

  it('follows the name when it changes, and goes back to the app when the page leaves', () => {
    const { rerender, unmount } = renderHook<undefined, { name: string | null }>(
      ({ name }) => {
        usePageTitle(name)
      },
      { initialProps: { name: 'Mentor platform' } },
    )

    rerender({ name: 'Booking app' })
    expect(document.title).toBe('Booking app | khoailanggraph')

    rerender({ name: null })
    expect(document.title).toBe('khoailanggraph')

    rerender({ name: 'Booking app' })
    unmount()
    expect(document.title).toBe('khoailanggraph')
  })

  it('sets the name again when something else writes another title, as the router does', async () => {
    renderHook(() => {
      usePageTitle('Mentor platform')
    })

    document.title = 'khoailanggraph'

    await waitFor(() => {
      expect(document.title).toBe('Mentor platform | khoailanggraph')
    })
  })
})
