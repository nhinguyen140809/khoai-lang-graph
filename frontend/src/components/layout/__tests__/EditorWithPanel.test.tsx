import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { EditorWithPanel } from '../EditorWithPanel'
import { useFrameStore } from '../frame.store'

beforeEach(() => {
  useFrameStore.setState({ bottomPanelVisible: true })
})

describe('EditorWithPanel', () => {
  it('shows the panel under the editor, and hides and shows it', async () => {
    render(
      <EditorWithPanel panelLabel="Trace and timeline" panel={<p>trace of REQ-001</p>}>
        <p>REQ-001 Search mentors</p>
      </EditorWithPanel>,
    )
    expect(screen.getByRole('region', { name: 'Trace and timeline' })).toHaveTextContent(
      'trace of REQ-001',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Hide Trace and timeline' }))

    expect(screen.queryByText('trace of REQ-001')).not.toBeInTheDocument()
    expect(screen.getByText('REQ-001 Search mentors')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show Trace and timeline' }))

    expect(screen.getByText('trace of REQ-001')).toBeInTheDocument()
  })
})
