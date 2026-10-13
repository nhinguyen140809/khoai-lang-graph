import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { ActivitiesContext } from '../activities/ActivitiesContext'
import type { Activity } from '../activities/activity.types'
import { useFrameStore } from '../frame.store'
import { SidePanel } from '../panels/SidePanel'
import { SidePanelSection } from '../panels/SidePanelSection'
import { ProjectWorkspace } from '../ProjectWorkspace'
import { type EditorTab, useEditorTabsStore } from '../tabs/editor-tabs.store'
import { useEditorTab } from '../tabs/hooks/useEditorTab'

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
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
  useFrameStore.setState(useFrameStore.getInitialState())
})

function tab(id: string): EditorTab {
  return { id, title: id, href: `/projects/p1/${id}` }
}

/** A page that opens its tab, once its title is known. */
function Page({ tab }: { tab: EditorTab | null }) {
  useEditorTab('p1', tab)
  return null
}

function workspace(page: ReactNode) {
  return (
    <ActivitiesContext value={{ activities, tabIcons: {} }}>
      <ProjectWorkspace projectId="p1">{page}</ProjectWorkspace>
    </ActivitiesContext>
  )
}

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

  it('opens the tab of a new page next to the tab of the page shown before', () => {
    useEditorTabsStore.setState({ groups: { p1: [tab('a'), tab('c')] } })
    setPathname('/projects/p1/a')
    const { rerender } = render(workspace(<Page key="a" tab={tab('a')} />))

    setPathname('/projects/p1/b')
    rerender(workspace(<Page key="b" tab={tab('b')} />))

    expect(useEditorTabsStore.getState().groups.p1?.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
  })

  it('opens it there too when the page knows its title after a while', () => {
    useEditorTabsStore.setState({ groups: { p1: [tab('a'), tab('c')] } })
    setPathname('/projects/p1/a')
    const { rerender } = render(workspace(<Page key="a" tab={tab('a')} />))

    setPathname('/projects/p1/b')
    rerender(workspace(<Page key="b" tab={null} />))
    rerender(workspace(<Page key="b" tab={tab('b')} />))

    expect(useEditorTabsStore.getState().groups.p1?.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
  })

  it('marks the tab of the page on screen, though its address has a query', () => {
    setPathname('/projects/p1/settings')
    render(
      workspace(
        <Page
          tab={{ id: 'settings', title: 'Settings', href: '/projects/p1/settings?section=members' }}
        />,
      ),
    )

    expect(screen.getByRole('link', { name: 'Settings, preview' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('has no side panel without features', () => {
    renderProjectWorkspace([])

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })
})
