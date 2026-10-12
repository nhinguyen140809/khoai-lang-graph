'use client'

import { useSearchParams } from 'next/navigation'

import { projectTabGroup, useEditorTab } from '@/components/layout'
import { ScrollArea } from '@/components/ui/scroll-area'

import { traceabilityHref } from '../traceability-links.utils'
import { IssuesView } from './IssuesView'
import { MatrixView } from './MatrixView'

/** The matrix, or the issues; the address says which, and which gap filters the matrix. */
export function TraceabilityPage({ projectId }: { projectId: string }) {
  const params = useSearchParams()
  const issues = params.get('view') === 'issues'

  useEditorTab(projectTabGroup(projectId), {
    id: issues ? 'issues' : 'matrix',
    title: issues ? 'Issues' : 'Matrix',
    href: traceabilityHref(projectId, issues ? { view: 'issues' } : {}),
    icon: 'view',
  })

  return (
    <ScrollArea className="h-full">
      {issues ? (
        <IssuesView projectId={projectId} />
      ) : (
        <MatrixView projectId={projectId} gap={params.get('gap')} />
      )}
    </ScrollArea>
  )
}
