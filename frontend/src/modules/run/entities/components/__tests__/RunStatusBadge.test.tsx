import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import { RunStatusBadge } from '../RunStatusBadge'
import { badgeCases } from './RunStatusBadge.data'

describe('RunStatusBadge', () => {
  it.each(badgeCases)(
    'says $text for $status in the $view view',
    async ({ status, view, text }) => {
      render(
        <ViewProvider value={view}>
          <RunStatusBadge status={status} />
        </ViewProvider>,
      )

      expect(screen.getByText(text)).toBeInTheDocument()
    },
  )

  it('reads in the user view without a view given', () => {
    render(<RunStatusBadge status="running" />)

    expect(screen.getByText('Working')).toBeInTheDocument()
  })
})
