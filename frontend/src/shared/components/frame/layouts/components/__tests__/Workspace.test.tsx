import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import type { Destination } from '../../../destinations/destination.types'
import { DestinationsContext } from '../../../destinations/DestinationsContext'
import { useSideFeatureStore } from '../../../destinations/side-feature.store'
import { SidePanel } from '../../../panels/components/SidePanel'
import { SidePanelSection } from '../../../panels/components/SidePanelSection'
import { PanelRegion } from '../../../panels/panel.constants'
import { usePanelsStore } from '../../../panels/panels.store'
import type { EditorTab } from '../../../tabs/editor-tabs.schema'
import { useEditorTabsStore } from '../../../tabs/editor-tabs.store'
import { useEditorTab } from '../../../tabs/hooks/useEditorTab'
import { Workspace } from '../Workspace'
import { newTabCases, sidePanelCases, tab } from './Workspace.data'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

function feature(id: string, title: string, content: string): Destination {
  return {
    id,
    label: title,
    icon: null,
    href: `/projects/p1/${id}` as Route,
    panel: <SidePanel title={title}>{content}</SidePanel>,
  }
}

const destinations: Destination[] = [
  feature('console', 'Console', 'outline'),
  feature('search', 'Search', 'results'),
  feature('artifacts', 'Artifacts', 'tree'),
]

beforeEach(() => {
  setPathname('/projects/p1/artifacts')
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
  usePanelsStore.setState(usePanelsStore.getInitialState())
  useSideFeatureStore.setState(useSideFeatureStore.getInitialState())
})

/** A page that opens its tab, once its title is known. */
function Page({ tab }: { tab: EditorTab | null }) {
  useEditorTab(tab)
  return null
}

function workspace(page: ReactNode) {
  return (
    <DestinationsContext value={{ destinations, tabIcons: {} }}>
      <Workspace tabGroup="p1">{page}</Workspace>
    </DestinationsContext>
  )
}

function renderWorkspace(given: Destination[] = destinations) {
  render(
    <DestinationsContext value={{ destinations: given, tabIcons: {} }}>
      <Workspace tabGroup="p1">
        <p>editor</p>
      </Workspace>
    </DestinationsContext>,
  )
}

describe('Workspace', () => {
  it.each(sidePanelCases)('shows $name, next to the editor', ({ pathname, chosen, panel }) => {
    setPathname(pathname)
    useSideFeatureStore.setState({ chosen })
    renderWorkspace()

    expect(
      screen.getAllByRole('complementary').map((aside) => aside.getAttribute('aria-label')),
    ).toEqual([panel])
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('keeps the editor when another side panel is shown', () => {
    renderWorkspace()

    act(() => {
      useSideFeatureStore.getState().choose('search')
    })

    expect(screen.getByRole('complementary', { name: 'Search' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Artifacts' })).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('hides the side panel with Ctrl+B and shows it again as it was', () => {
    renderWorkspace([
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

  it.each(newTabCases)(
    'opens the tab of a new page next to the tab of the page shown before, $name',
    ({ open, renders }) => {
      useEditorTabsStore.setState({ groups: { p1: open } })
      setPathname('/projects/p1/a')
      const { rerender } = render(workspace(<Page key="a" tab={tab('a')} />))

      setPathname('/projects/p1/b')
      for (const rendered of renders) rerender(workspace(<Page key="b" tab={rendered} />))

      expect(useEditorTabsStore.getState().groups.p1?.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
    },
  )

  it('opens no tab for a page outside a workspace with tabs', () => {
    render(<Page tab={tab('a')} />)

    expect(useEditorTabsStore.getState().groups).toEqual({})
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

  it('has no side panel without features, and leaves Ctrl+B alone', () => {
    renderWorkspace([])

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('editor')
    const ctrlB = fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(ctrlB).toBe(true)
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(true)
  })
})
