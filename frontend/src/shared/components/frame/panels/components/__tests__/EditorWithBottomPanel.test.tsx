import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import type { BottomPanelSection } from '../../panel.types'
import { usePanelsStore } from '../../panels.store'
import { EditorWithBottomPanel } from '../EditorWithBottomPanel'

const trace: BottomPanelSection[] = [
  { id: 'trace', title: 'Trace', content: <p>trace of REQ-001</p> },
]

beforeEach(() => {
  usePanelsStore.setState(usePanelsStore.getInitialState())
})

describe('EditorWithBottomPanel', () => {
  it('shows the panel under the editor, and hides and shows it', async () => {
    render(
      <EditorWithBottomPanel panelLabel="Trace and timeline" sections={trace}>
        <p>REQ-001 Search mentors</p>
      </EditorWithBottomPanel>,
    )
    expect(screen.getByRole('region', { name: 'Trace and timeline' })).toHaveTextContent(
      'trace of REQ-001',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Hide Trace and timeline' }))

    expect(screen.getByText('trace of REQ-001')).not.toBeVisible()
    expect(screen.getByText('REQ-001 Search mentors')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Show Trace and timeline' }))

    expect(screen.getByText('trace of REQ-001')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Show Trace and timeline' }),
    ).not.toBeInTheDocument()
  })

  it('hides and shows the panel with Ctrl+`', () => {
    render(
      <EditorWithBottomPanel panelLabel="Trace" sections={trace}>
        <p>REQ-001 Search mentors</p>
      </EditorWithBottomPanel>,
    )

    fireEvent.keyDown(document, { key: '`', ctrlKey: true })
    expect(screen.getByText('trace of REQ-001')).not.toBeVisible()

    fireEvent.keyDown(document, { key: '`', ctrlKey: true })
    expect(screen.getByText('trace of REQ-001')).toBeVisible()
  })

  it('keeps the editor and the panel as they were while the panel is hidden', async () => {
    render(
      <EditorWithBottomPanel
        panelLabel="Trace"
        sections={[{ id: 'trace', title: 'Trace', content: <input aria-label="Filter" /> }]}
      >
        <input aria-label="Title" />
      </EditorWithBottomPanel>,
    )
    // Without layout in jsdom, a click in the group of panels lands on its handle.
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Search mentors' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter' }), { target: { value: 'REQ' } })

    await userEvent.click(screen.getByRole('button', { name: 'Hide Trace' }))
    await userEvent.click(screen.getByRole('button', { name: 'Show Trace' }))

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Search mentors')
    expect(screen.getByRole('textbox', { name: 'Filter' })).toHaveValue('REQ')
  })
})
