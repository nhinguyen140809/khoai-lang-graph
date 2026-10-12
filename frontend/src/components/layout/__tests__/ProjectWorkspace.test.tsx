import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { ActivitiesContext } from '../activity-bar/ActivitiesContext'
import type { Activity } from '../activity-bar/activity.types'
import { useEditorTabsStore } from '../editor/editor-tabs.store'
import { useFrameStore } from '../frame.store'
import { ProjectWorkspace } from '../ProjectWorkspace'
import { SidePanel } from '../side-panel/SidePanel'
import { SidePanelSection } from '../side-panel/SidePanelSection'

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

function renderProjectWorkspace(given: Activity[] = activities) {
  render(
    <ActivitiesContext value={{ activities: given, tabIcons: {} }}>
      <ProjectWorkspace projectId="p1">
        <p>editor</p>
      </ProjectWorkspace>
    </ActivitiesContext>,
  )
}

describe('ProjectWorkspace', () => {
  it('shows the side panel of the page opened, next to the editor', () => {
    renderProjectWorkspace()

    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('shows the first feature when the page belongs to none', () => {
    setPathname('/projects/p1/unknown')
    renderProjectWorkspace()

    expect(screen.getByRole('complementary', { name: 'Console' })).toBeInTheDocument()
  })

  it('keeps the editor when another side panel is shown', () => {
    renderProjectWorkspace()

    act(() => {
      useFrameStore.getState().showSideFeature('search')
    })

    expect(screen.getByRole('complementary', { name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Artifacts' })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('falls back to the page on screen when the chosen feature is not given', () => {
    useFrameStore.setState({ sideFeature: 'traceability' })
    renderProjectWorkspace()

    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeInTheDocument()
  })

  it('hides the side panel with Ctrl+B and shows it again as it was', () => {
    renderProjectWorkspace([
      {
        ...feature('artifacts', 'Artifacts', ''),
        panel: (
          <SidePanel title="Artifacts">
            <SidePanelSection title="Outline">tree</SidePanelSection>
          </SidePanel>
        ),
      },
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Outline' }))

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('complementary', { name: 'Artifacts', hidden: true })).not.toBeVisible()

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('complementary', { name: 'Artifacts' })).toBeVisible()
    // Hidden, not unmounted: the section is still collapsed.
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('has no side panel without features', () => {
    renderProjectWorkspace([])

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })
})
