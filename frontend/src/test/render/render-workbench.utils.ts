import { createElement, type ReactNode } from 'react'

import { Workbench } from '@/shared/components/frame'

import { renderWithProviders } from './render-with-providers.utils'

// The frame of a project, with the parts that a slice contributes: its status bar items, its
// commands and its dialogs.
function workbenchWith(contributions: ReactNode) {
  return createElement(Workbench, {
    crumb: 'Mentor platform',
    homeHref: '/',
    contributions,
    children: createElement('main'),
  })
}

/**
 * Renders the frame of the app with its providers and the parts that a slice contributes to it, so
 * that a test reads them where the frame shows them: the status bar, the command palette, the
 * activity bar. `rerenderContributions` renders the same frame with other parts, or none.
 */
export function renderWorkbench(contributions: ReactNode) {
  const view = renderWithProviders(workbenchWith(contributions))

  return {
    ...view,
    rerenderContributions: (next: ReactNode) => {
      view.rerender(workbenchWith(next))
    },
  }
}
