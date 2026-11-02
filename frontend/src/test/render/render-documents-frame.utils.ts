import { createElement, type ReactNode } from 'react'

import { projectIds } from '@/mocks/shared/db'
import { documentsDestination, DocumentsTabIcons } from '@/modules/documents/widgets/panel'
import { TabbedWorkspace, Workbench } from '@/shared/components/frame'

import { openPage } from '../msw'
import { setParams, setPathname } from '../next-stubs'
import { renderWithProviders } from './render-with-providers.utils'

interface DocumentsFrameOptions {
  /** The path of the page, such as `/projects/<id>/documents/<artifact id>`. */
  pathname: string
  /** The dynamic parameters of that path, such as `{ artifactId }`. */
  params?: Record<string, string>
  /** The address of the page with its scenario of the mocks, such as `/?mock-artifacts=empty`. */
  scenario?: string
  /** The project that Documents belongs to; the mentor platform when left out. */
  projectId?: string
}

/**
 * Renders a page of Documents in the frame of a project: its side panel on the activity bar, the
 * tabs and the page in the editor. The address and the route parameters are set before it renders,
 * since the panel reads them to find the open document. Three widgets share it, so it sits here.
 */
export function renderDocumentsFrame(
  page: ReactNode,
  { pathname, params = {}, scenario = '/', projectId = projectIds.mentor }: DocumentsFrameOptions,
) {
  openPage(scenario)
  setPathname(pathname)
  setParams(params)
  return renderWithProviders(
    createElement(Workbench, {
      crumb: 'Mentor platform',
      homeHref: '/',
      destinations: [documentsDestination(projectId)],
      contributions: createElement(DocumentsTabIcons),
      children: createElement(TabbedWorkspace, { tabGroup: projectId, children: page }),
    }),
  )
}
