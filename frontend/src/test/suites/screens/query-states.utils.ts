import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'

import type { QueryStateCase, QueryStatesSuite } from './query-states.types'

/**
 * Tests that a screen shows what belongs to each state of its query (loaded, empty, not found,
 * failed): each case sets the answer of the server, renders the screen, and reads what it shows.
 */
export function itShowsQueryStates<Case extends QueryStateCase>({
  renderScreen,
  cases,
}: QueryStatesSuite<Case>) {
  it.each(cases)('shows $name', async (state) => {
    if (state.answer !== null) server.use(state.answer())

    renderScreen(state)

    expect(await screen.findByText(state.shows)).toBeInTheDocument()
    if (state.hides !== undefined) expect(screen.queryByText(state.hides)).not.toBeInTheDocument()
  })
}
