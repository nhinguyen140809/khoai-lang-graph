import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ActivityBar } from '../ActivityBar'
import { useEditorTabsStore } from '../editor-tabs.store'
import { useFrameStore } from '../frame.store'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  setPathname('/projects/p1/chat/t1')
  useEditorTabsStore.setState({ groups: {}, lastHrefs: {} })
  useFrameStore.setState({ sidePanelVisible: true })
})

describe('ActivityBar', () => {
  it('links every feature of the project and marks the one on screen', () => {
    render(<ActivityBar user={<button type="button">Account</button>} projectId="p1" />, {
      wrapper: TestProviders,
    })

    expect(screen.getByRole('link', { name: 'Chat' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Artifacts' })).toHaveAttribute(
      'href',
      '/projects/p1/artifacts',
    )
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/projects/p1/settings',
    )
    expect(screen.getByRole('button', { name: /Sources/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('returns to the page last shown in a feature', () => {
    useEditorTabsStore.setState({ lastHrefs: { 'p1:workflow': '/projects/p1/workflow/r3' } })
    render(<ActivityBar user={<button type="button">Account</button>} projectId="p1" />, {
      wrapper: TestProviders,
    })

    expect(screen.getByRole('link', { name: 'Workflow' })).toHaveAttribute(
      'href',
      '/projects/p1/workflow/r3',
    )
  })

  it('hides and shows the side panel from the item of the feature on screen', async () => {
    render(<ActivityBar user={<button type="button">Account</button>} projectId="p1" />, {
      wrapper: TestProviders,
    })

    await userEvent.click(screen.getByRole('link', { name: 'Chat' }))
    expect(useFrameStore.getState().sidePanelVisible).toBe(false)

    await userEvent.click(screen.getByRole('link', { name: 'Artifacts' }))
    expect(useFrameStore.getState().sidePanelVisible).toBe(true)
  })

  it('disables the features outside a project', () => {
    render(<ActivityBar user={<button type="button">Account</button>} />, {
      wrapper: TestProviders,
    })

    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chat, select a project first/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('shows a badge in the name of its item', () => {
    render(
      <ActivityBar
        projectId="p1"
        user={null}
        badges={{ chat: <span className="sr-only">, 1 review waiting</span> }}
      />,
      { wrapper: TestProviders },
    )

    expect(screen.getByRole('link', { name: 'Chat, 1 review waiting' })).toBeInTheDocument()
  })
})
