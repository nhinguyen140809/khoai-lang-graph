import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { useEditorTabsStore } from '../editor-tabs.store'
import { useFrameStore } from '../frame.store'
import { SidePanel } from '../SidePanel'
import { Workbench } from '../Workbench'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/projects/p1/chat')
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
  useFrameStore.setState({ sidePanelVisible: true })
})

function renderWorkbench() {
  render(
    <Workbench projectId="p1" feature="chat" side={<SidePanel title="Threads">list</SidePanel>}>
      <p>editor</p>
    </Workbench>,
  )
}

describe('Workbench', () => {
  it('shows the side panel next to the editor', () => {
    renderWorkbench()

    expect(screen.getByRole('complementary', { name: 'Threads' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('fills the workbench with the editor when the feature has no side panel', () => {
    render(
      <Workbench projectId="p1" feature="chat">
        <p>editor</p>
      </Workbench>,
    )

    expect(screen.getByRole('main')).toHaveTextContent('editor')
    // Ctrl+B is a feature of the side panel, so without one it does nothing.
    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('hides and shows the side panel with Ctrl+B', () => {
    renderWorkbench()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.queryByRole('complementary', { name: 'Threads' })).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('complementary', { name: 'Threads' })).toBeInTheDocument()
  })

  it('remembers the page on screen for the activity bar', () => {
    renderWorkbench()

    expect(useEditorTabsStore.getState().lastHrefs['p1:chat']).toBe('/projects/p1/chat')
  })
})
