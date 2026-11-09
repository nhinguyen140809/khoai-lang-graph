import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'

import { GapPage } from '../GapPage'

const projectId = projectIds.mentor

function renderPage(gapKey: string) {
  return renderWithProviders(<GapPage projectId={projectId} gapKey={gapKey} />)
}

describe('GapPage', () => {
  it('names the page after the gap and lists its items', async () => {
    renderPage('needs_review')

    expect(await screen.findByText('Links to check')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The item that each of these links is based on changed after the link was made, or was replaced.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })

  it('names each item by its kind and its title, without its key or its document', async () => {
    renderPage('needs_review')

    // The row names the item only: its kind and its title, without the document it sits in.
    expect(await screen.findByText('Book a session')).toBeInTheDocument()
    expect(screen.getAllByText('Requirement').length).toBeGreaterThan(0)
    // The key is left out: the kind and the title say which item the row is.
    expect(screen.queryByText('REQ-003')).not.toBeInTheDocument()
  })

  it('opens a page named after the key for a gap the coverage does not list, with its list empty', async () => {
    renderPage('no_such_gap')

    // The page opens as any gap does, so the tab and the title say which list it is.
    expect(
      await screen.findByRole('heading', { level: 1, name: /No such gap/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('This list is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to the overview' })).not.toBeInTheDocument()
  })

  it('boxes each target that changed under its item, with the versions as two badges', async () => {
    renderPage('needs_review')

    // Each changed target says what the item is based on, and how far it moved.
    const made = await screen.findAllByText(/Link made from version \d/)
    expect(made.length).toBeGreaterThan(1)
    expect(screen.getAllByText(/Now version \d/)).toHaveLength(made.length)
    // A target that kept its version was replaced, which one badge says instead of the versions.
    const replaced = screen.getAllByText('Replaced by another item')
    expect(replaced.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^It (is based on|depends on|applies to)/)).toHaveLength(
      made.length + replaced.length,
    )
  })

  it('opens the item of a row, and the chain of it, from its two buttons', async () => {
    const user = userEvent.setup()
    routerMock.push.mockClear()
    renderPage('needs_review')

    const open = (await screen.findAllByRole('button', { name: 'Open in a new tab' }))[0]
    if (open === undefined) throw new Error('The gap holds no item')
    await user.click(open)
    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(expect.stringContaining(`/items/`))
    })

    routerMock.push.mockClear()
    const trace = screen.getAllByRole('button', { name: 'View its trace' })[0]
    if (trace === undefined) throw new Error('The gap holds no item')
    await user.click(trace)
    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(
        expect.stringContaining(`/projects/${projectId}/trace/items/`),
      )
    })
  })
})
