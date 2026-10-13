'use client'

import { useSearchParams } from 'next/navigation'

import { projectTabGroup, useEditorTab } from '@/shared/components/frame'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { RouteParam, traceabilityHref } from '@/shared/config/routes.utils'

import { TraceabilityTabIcon } from '../traceability-frame.config'
import { IssuesView } from './IssuesView'
import { MatrixView } from './MatrixView'

/** The matrix, or the issues; the address says which, and which gap filters the matrix. */
export function TraceabilityPage({ projectId }: { projectId: string }) {
  const params = useSearchParams()
  const issues = params.get(RouteParam.View) === 'issues'

  useEditorTab(projectTabGroup(projectId), {
    id: issues ? 'issues' : 'matrix',
    title: issues ? 'Issues' : 'Matrix',
    href: traceabilityHref(projectId, issues ? { view: 'issues' } : {}),
    icon: TraceabilityTabIcon.View,
  })

  return (
    <ScrollArea className="h-full">
      {issues ? (
        <IssuesView projectId={projectId} />
      ) : (
        <MatrixView projectId={projectId} gap={params.get(RouteParam.Gap)} />
      )}
    </ScrollArea>
  )
}
