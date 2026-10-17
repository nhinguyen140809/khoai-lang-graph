import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ViewContext } from '@/shared/hooks/useView'

import { RunStatusBadge } from '../RunStatusBadge'
import { badgeCases } from './RunStatusBadge.data'

describe('RunStatusBadge', () => {
  it.each(badgeCases)('says $text for $status in the $view view', ({ status, view, text }) => {
    render(
      <ViewContext value={view}>
        <RunStatusBadge status={status} />
      </ViewContext>,
    )

    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('reads in the user view without a view given', () => {
    render(<RunStatusBadge status="running" />)

    expect(screen.getByText('Working')).toBeInTheDocument()
  })
})
