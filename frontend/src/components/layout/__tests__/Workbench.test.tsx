import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { ActivitiesContext } from '../ActivitiesContext'
import type { Activity } from '../activity.types'
import { useEditorTabsStore } from '../editor-tabs.store'
import { useFrameStore } from '../frame.store'
import { SidePanel } from '../SidePanel'
import { Workbench } from '../Workbench'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

function feature(id: string, title: string, content: string): Activity {
  return {
    id,
    label: title,
    icon: null,
    href: `/projects/p1/${id}` as Route,
    panel: <SidePanel title={title}>{content}</SidePanel>,
  }
}

const activities: Activity[] = [
  feature('console', 'Console', 'outline'),
  feature('search', 'Search', 'results'),
  feature('artifacts', 'Artifacts', 'tree'),
]

beforeEach(() => {
  setPathname('/projects/p1/artifacts')
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
  useFrameStore.setState({ sidePanelVisible: true, sideFeature: null })
})

function renderWorkbench(given: Activity[] = activities) {
  render(
    <ActivitiesContext value={{ activities: given, tabIcons: {} }}>
      <Workbench projectId="p1">
        <p>editor</p>
      </Workbench>
    </ActivitiesContext>,
  )
}

describe('Workbench', () => {
  it('shows the side panel of the page opened, next to the editor', () => {
    renderWorkbench()

    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('shows the first feature when the page belongs to none', () => {
    setPathname('/projects/p1/unknown')
    renderWorkbench()

    expect(screen.getByRole('complementary', { name: 'Console' })).toBeInTheDocument()
  })

  it('keeps the editor when another side panel is shown', () => {
    renderWorkbench()

    act(() => {
      useFrameStore.getState().showSideFeature('search')
    })

    expect(screen.getByRole('complementary', { name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Artifacts' })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('falls back to the page on screen when the chosen feature is not given', () => {
    useFrameStore.setState({ sideFeature: 'traceability' })
    renderWorkbench()

    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeInTheDocument()
  })

  it('hides and shows the side panel with Ctrl+B', () => {
    renderWorkbench()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.queryByRole('complementary', { name: 'Artifacts' })).not.toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeInTheDocument()
  })

  it('has no side panel without features', () => {
    renderWorkbench([])

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('remembers the page on screen for the tabs', () => {
    renderWorkbench()

    expect(useEditorTabsStore.getState().lastHrefs.p1).toBe('/projects/p1/artifacts')
  })
})
