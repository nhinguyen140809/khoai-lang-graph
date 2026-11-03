import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { setPathname } from '@/test/next-stubs'
import { expectAttribute, expectNoRole, expectRole } from '@/test/steps'

import { frameWrapper } from '../../../__tests__/frame-wrapper.utils.data'
import { seedTabs, tabsOf } from '../../../__tests__/tab-state.utils.data'
import type { Destination } from '../../../destinations/destination.types'
import { useSideFeatureStore } from '../../../destinations/side-feature.store'
import { SidePanel } from '../../../panels/components/SidePanel'
import { SidePanelSection } from '../../../panels/components/SidePanelSection'
import { PanelRegion } from '../../../panels/panel.types'
import { usePanelsStore } from '../../../panels/panels.store'
import { useEditorTabsStore } from '../../../tabs/editor-tabs.store'
import type { EditorTab } from '../../../tabs/editor-tabs.types'
import { useEditorTab } from '../../../tabs/hooks/useEditorTab'
import { TabbedWorkspace } from '../TabbedWorkspace'
import { newTabCases, sidePanelCases, tab } from './TabbedWorkspace.data'

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
})

/** A page that opens its tab, once its title is known. */
function Page({ tab }: { tab: EditorTab | null }) {
  useEditorTab(tab)
  return null
}

function workspace(page: ReactNode) {
  return <TabbedWorkspace tabGroup="p1">{page}</TabbedWorkspace>
}

function renderTabbedWorkspace(given: Destination[] = destinations) {
  render(workspace(<p>editor</p>), { wrapper: frameWrapper({ destinations: given }) })
}

describe('TabbedWorkspace', () => {
  it.each(sidePanelCases)('shows $name, next to the editor', ({ pathname, chosen, panel }) => {
    setPathname(pathname)
    useSideFeatureStore.setState({ chosen })
    renderTabbedWorkspace()

    expect(
      screen.getAllByRole('complementary').map((aside) => aside.getAttribute('aria-label')),
    ).toEqual([panel])
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('keeps the editor when another side panel is shown', async () => {
    renderTabbedWorkspace()

    act(() => {
      useSideFeatureStore.getState().choose('search')
    })

    await expectRole('complementary', 'Search')
    expectNoRole('complementary', 'Artifacts')
    expect(screen.getByRole('main')).toHaveTextContent('editor')
  })

  it('hides the side panel with Ctrl+B and shows it again as it was', () => {
    renderTabbedWorkspace([
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
    expectAttribute('button', 'Outline', 'aria-expanded', 'false')
  })

  it.each(newTabCases)(
    'opens the tab of a new page next to the tab of the page shown before, $name',
    ({ open, renders }) => {
      seedTabs('p1', { tabs: open })
      setPathname('/projects/p1/a')
      const { rerender } = render(workspace(<Page key="a" tab={tab('a')} />), {
        wrapper: frameWrapper({ destinations }),
      })

      setPathname('/projects/p1/b')
      for (const rendered of renders) rerender(workspace(<Page key="b" tab={rendered} />))

      expect(tabsOf('p1').tabs.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
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
      { wrapper: frameWrapper({ destinations }) },
    )

    expectAttribute('link', 'Settings, preview', 'aria-current', 'page')
  })

  it('has no side panel without features, and leaves Ctrl+B alone', () => {
    renderTabbedWorkspace([])

    expectNoRole('complementary')
    expect(screen.getByRole('main')).toHaveTextContent('editor')
    const isAllowed = fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
    expect(isAllowed).toBe(true)
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(true)
  })
})
