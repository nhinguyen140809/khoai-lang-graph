'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { artifactTitle } from '../artifacts.utils'
import { useProjectArtifacts } from '../hooks/useProjectArtifacts'
import { useProjectTreeItems } from '../hooks/useProjectTreeItems'

interface ArtifactsPanelProps {
  projectId: string
}

const rowClass =
  'flex min-w-0 items-center gap-2 rounded-sm px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent'

/**
 * The tree of the Artifacts tab: every artifact of the project with its items
 * under it, grouped by item kind. An artifact opens as a document, an item in
 * the artifact's editor tab.
 */
export function ArtifactsPanel({ projectId }: ArtifactsPanelProps) {
  const artifacts = useProjectArtifacts(projectId)
  const items = useProjectTreeItems(projectId)
  const pathname = usePathname()

  if (artifacts.isPending || items.isPending) {
    return <LoadingState label="Loading artifacts" rows={4} className="px-2" />
  }
  if (artifacts.isError) {
    return (
      <ErrorState
        message={artifacts.error.message}
        onRetry={() => void artifacts.refetch()}
        className="px-2"
      />
    )
  }
  if (items.isError) {
    return (
      <ErrorState
        message={items.error.message}
        onRetry={() => void items.refetch()}
        className="px-2"
      />
    )
  }
  if (artifacts.data.length === 0) {
    return (
      <EmptyState
        title="No artifacts yet"
        description="The first message in Chat starts the workflow that writes the artifacts."
        size="compact"
        className="px-2"
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 px-1 py-2">
      {artifacts.data.map((artifact) => (
        <section key={artifact.id} aria-label={artifactTitle(artifact)} className="flex flex-col">
          <Link
            href={`/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifact.id)}`}
            aria-current={
              pathname ===
              `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifact.id)}`
                ? 'page'
                : undefined
            }
            className={cn(rowClass, 'font-medium text-sidebar-foreground')}
          >
            <span className="truncate">{artifactTitle(artifact)}</span>
            {artifact.review_status === 'approved' ? null : (
              <Badge variant="outline" className="ml-auto shrink-0 text-[0.625rem]">
                draft
              </Badge>
            )}
          </Link>
          {items.data
            .filter((item) => item.artifact_id === artifact.id)
            .map((item) => (
              <Link
                key={item.id}
                href={`/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifact.id)}/${encodeURIComponent(item.id)}`}
                aria-current={
                  pathname.endsWith(`/${encodeURIComponent(item.id)}`) ? 'page' : undefined
                }
                className={cn(rowClass, 'pl-5 text-muted-foreground')}
              >
                <span className="font-mono text-xs">{item.key}</span>
              </Link>
            ))}
        </section>
      ))}
    </div>
  )
}
