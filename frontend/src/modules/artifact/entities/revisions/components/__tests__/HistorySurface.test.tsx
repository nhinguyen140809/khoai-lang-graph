import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, pressKey } from '@/test/steps'
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
    const user = userEvent.setup()
    renderSurface()

    await user.click(screen.getByRole('button', { name: 'History' }))

    expect(screen.getByRole('heading', { name: 'History' })).toHaveFocus()
    expect(screen.getByText(`Version ${String(historyCurrentVersion)}`)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Show changes' })).toBeInTheDocument()
  })

  it('steps with Newer and Older, and disables them at the ends', async () => {
    const user = userEvent.setup()
    renderSurface()
    await user.click(screen.getByRole('button', { name: 'History' }))

    await user.click(screen.getByRole('button', { name: 'Older version' }))
    // The old version goes out first, and the next one comes in after it.
    expect(
      await screen.findByText(`Version ${String(historyCurrentVersion - 1)}`),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Newer version' }))
    expect(screen.getByRole('button', { name: 'Newer version' })).toBeDisabled()
  })

  it('shows the list of every version, marks the selected one, and closes with Escape back to the button', async () => {
    const user = userEvent.setup()
    renderSurface()
    await user.click(screen.getByRole('button', { name: 'History' }))
    await user.click(screen.getByRole('button', { name: 'Show all versions' }))

    const first = screen.getByRole('button', { name: /Version 2/ })
    expect(first).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: /Version 1/ }))
    expect(screen.getByRole('button', { name: /Version 1/ })).toHaveAttribute(
      'aria-current',
      'true',
    )

    // Escape steps down to the stepper, then to closed, and returns the focus to the button.
    await pressKey('Escape')
    expect(screen.queryByRole('button', { name: /Version 1/ })).not.toBeInTheDocument()
    await pressKey('Escape')
    expect(screen.getByRole('button', { name: 'History' })).toHaveFocus()
  })

  it('goes back from the list with the Collapse line, and minimizes to the button', async () => {
    const user = userEvent.setup()
    renderSurface()
    await user.click(screen.getByRole('button', { name: 'History' }))
    await user.click(screen.getByRole('button', { name: 'Show all versions' }))

    await user.click(screen.getByRole('button', { name: 'Collapse' }))
    expect(screen.getByRole('button', { name: 'Newer version' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Minimize the history' }))
    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('button', { name: 'History' })).toHaveFocus()
  })

  it('offers the restore of a version that is not the current one, in the menu of its item', async () => {
    const user = userEvent.setup()
    renderSurface()
    await user.click(screen.getByRole('button', { name: 'History' }))

    expect(screen.queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Older version' }))
    await user.click(await screen.findByRole('button', { name: 'More actions' }))
    expect(
      await screen.findByRole('button', { name: `Restore ${String(historyCurrentVersion - 1)}` }),
    ).toBeInTheDocument()
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
    const user = userEvent.setup()
    const { container } = renderSurface()
    await user.click(screen.getByRole('button', { name: 'History' }))
    await screen.findByText('Your edit')

    await expectNoAccessibilityViolations(container)
  })
})
