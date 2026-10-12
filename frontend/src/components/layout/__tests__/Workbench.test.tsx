import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { useEditorTabsStore } from '../editor-tabs.store'
import { useFrameStore } from '../frame.store'
import { SidePanel } from '../SidePanel'
import { Workbench } from '../Workbench'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const sidePanels = {
  console: <SidePanel title="Console">outline</SidePanel>,
  search: <SidePanel title="Search">results</SidePanel>,
  artifacts: <SidePanel title="Artifacts">tree</SidePanel>,
  workflow: <SidePanel title="Runs">runs</SidePanel>,
  traceability: <SidePanel title="Traceability">views</SidePanel>,
  settings: <SidePanel title="Project settings">sections</SidePanel>,
}

beforeEach(() => {
  setPathname('/projects/p1/console')
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
  useFrameStore.setState({ sidePanelVisible: true, sideFeature: null })
})

function renderWorkbench() {
  render(
    <Workbench projectId="p1" sidePanels={sidePanels}>
      <p>editor</p>
    </Workbench>,
  )
}

describe('Workbench', () => {
  it('shows the side panel of the page opened, next to the editor', () => {
    renderWorkbench()

    expect(screen.getByRole('complementary', { name: 'Console' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('keeps the editor when another side panel is shown', () => {
    renderWorkbench()

    act(() => {
      useFrameStore.getState().showSideFeature('search')
    })

    expect(screen.getByRole('complementary', { name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Console' })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('hides and shows the side panel with Ctrl+B', () => {
    renderWorkbench()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.queryByRole('complementary', { name: 'Console' })).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('complementary', { name: 'Console' })).toBeInTheDocument()
  })

  it('remembers the page on screen for the tabs', () => {
    renderWorkbench()

    expect(useEditorTabsStore.getState().lastHrefs.p1).toBe('/projects/p1/console')
  })
})
