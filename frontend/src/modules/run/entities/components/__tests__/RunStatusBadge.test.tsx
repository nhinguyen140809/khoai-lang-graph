import { render } from '@testing-library/react'
import { describe, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'
import { expectText } from '@/test/steps'

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

      await expectText(text)
    },
  )

  it('reads in the user view without a view given', async () => {
    render(<RunStatusBadge status="running" />)

    await expectText('Working')
  })
})
