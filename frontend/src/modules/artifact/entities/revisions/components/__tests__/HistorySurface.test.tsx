import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectDisabled,
  expectFocused,
  expectNoAccessibilityViolations,
  expectNoRole,
  expectRole,
  expectText,
  pressButton,
  pressKey,
} from '@/test/steps'
import { itShowsQueryStates } from '@/test/suites'

import { useHistoryView } from '../../../revisions/hooks/useHistoryView'
import { HistorySurface } from '../HistorySurface'
import { historyCurrentVersion, historyTarget } from './history.fixtures.data'

/** The surface with the state of its history, which the page holds. */
function Surface({ isHidden = false }: { isHidden?: boolean }) {
  const view = useHistoryView(historyCurrentVersion, { isHidden })
  return (
    <HistorySurface
      target={historyTarget}
      currentVersion={historyCurrentVersion}
      view={view}
      renderRestore={(version) => <button type="button">{`Restore ${String(version)}`}</button>}
    />
  )
}

function renderSurface() {
  return renderWithProviders(<Surface />)
}

describe('HistorySurface', () => {
  it('reads nothing while it is closed', () => {
    renderSurface()

    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('opens at the level of the version and focuses its heading', async () => {
    renderSurface()

    await pressButton('History')

    expectFocused('heading', 'History')
    await expectText(`Version ${String(historyCurrentVersion)}`)
    await expectRole('checkbox', 'Show changes')
  })

  it('steps with Newer and Older, and disables them at the ends', async () => {
    renderSurface()
    await pressButton('History')

    await pressButton('Older version')
    // The old version goes out first, and the next one comes in after it.
    await expectText(`Version ${String(historyCurrentVersion - 1)}`)

    await pressButton('Newer version')
    expectDisabled('button', 'Newer version')
  })

  it('shows the list of every version, marks the selected one, and closes with Escape back to the button', async () => {
    renderSurface()
    await pressButton('History')
    await pressButton('Show all versions')

    const first = screen.getByRole('button', { name: /Version 2/ })
    expect(first).toHaveAttribute('aria-current', 'true')
    await pressButton(/Version 1/)
    expect(screen.getByRole('button', { name: /Version 1/ })).toHaveAttribute(
      'aria-current',
      'true',
    )

    // Escape steps down to the stepper, then to closed, and returns the focus to the button.
    await pressKey('Escape')
    expectNoRole('button', /Version 1/)
    await pressKey('Escape')
    expectFocused('button', 'History')
  })

  it('goes back from the list with the Collapse line, and minimizes to the button', async () => {
    renderSurface()
    await pressButton('History')
    await pressButton('Show all versions')

    await pressButton('Collapse')
    await expectRole('button', 'Newer version')

    await pressButton('Minimize the history')
    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expectFocused('button', 'History')
  })

  it('offers the restore of a version that is not the current one, in the menu of its item', async () => {
    renderSurface()
    await pressButton('History')

    expectNoRole('button', /Restore/)
    await pressButton('Older version')
    await pressButton('More actions')
    await expectRole('button', `Restore ${String(historyCurrentVersion - 1)}`)
  })

  itShowsQueryStates({
    // The History button opens the surface, which reads the versions; the states of the query
    // show inside it.
    renderScreen: () => {
      renderSurface()
      void userEvent.setup().click(screen.getByRole('button', { name: 'History' }))
    },
    cases: [
      {
        name: 'the versions',
        answer: null,
        shows: 'Your edit',
      },
      {
        name: 'a failure of the versions',
        answer: () => serverErrorOn(HttpMethod.Get, apiEndpoints.itemRevisions.pattern),
        shows: 'The versions could not load.',
        hides: 'Your edit',
      },
    ],
  })

  it('has no accessibility violation', async () => {
    const { container } = renderSurface()
    await pressButton('History')
    await expectText('Your edit')

    await expectNoAccessibilityViolations(container)
  })
})
