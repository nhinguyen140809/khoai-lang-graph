'use client'

import { useSearchParams } from 'next/navigation'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'

import { traceabilityHref } from '../traceability-links.utils'
import { IssuesView } from './IssuesView'
import { MatrixView } from './MatrixView'

/** The matrix, or the issues; the address says which, and which gap filters the matrix. */
export function TraceabilityPage({ projectId }: { projectId: string }) {
  const params = useSearchParams()
  const issues = params.get('view') === 'issues'

  useEditorTab(featureTabGroup(projectId, 'traceability'), {
    id: issues ? 'issues' : 'matrix',
    title: issues ? 'Issues' : 'Matrix',
    href: traceabilityHref(projectId, issues ? { view: 'issues' } : {}),
    icon: 'view',
  })

  return issues ? (
    <IssuesView projectId={projectId} />
  ) : (
    <MatrixView projectId={projectId} gap={params.get('gap')} />
  )
}
