'use client'

import Link from 'next/link'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { artifactTitle, itemsOfArtifact } from '../artifacts.utils'
import { useProjectArtifacts } from '../hooks/useProjectArtifacts'
import { useProjectTreeItems } from '../hooks/useProjectTreeItems'

interface ArtifactPageProps {
  projectId: string
  artifactId: string
}

/**
 * An artifact as a document: its title and state on top, then one row per item
 * it holds, grouped by item kind. A row opens the item in the artifact's tab.
 */
export function ArtifactPage({ projectId, artifactId }: ArtifactPageProps) {
  const artifacts = useProjectArtifacts(projectId)
  const items = useProjectTreeItems(projectId)
  const artifact = artifacts.data?.find((entry) => entry.id === artifactId)

  useEditorTab(featureTabGroup(projectId, 'artifacts'), {
    id: artifactId,
    title: artifact ? artifactTitle(artifact) : 'Artifact',
    href: `/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}`,
    icon: 'artifact',
  })

  if (artifacts.isPending || items.isPending) {
    return <LoadingState label="Loading the artifact" className="p-6" />
  }
  if (artifacts.isError) {
    return (
      <ErrorState
        message={artifacts.error.message}
        onRetry={() => void artifacts.refetch()}
        className="p-6"
      />
    )
  }
  if (artifact === undefined) {
    return (
      <NotFoundState
        title="Artifact not found"
        description="It may have been deleted, or the link is stale."
      />
    )
  }
  if (items.isError) {
    return (
      <ErrorState
        message={items.error.message}
        onRetry={() => void items.refetch()}
        className="p-6"
      />
    )
  }

  const groups = itemsOfArtifact(items.data, artifactId)

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">{artifactTitle(artifact)}</h1>
        <Badge variant="soft">{artifact.kind}</Badge>
        <Badge variant="outline" className="font-mono">
          v{artifact.version}
        </Badge>
        <Badge variant="soft">{artifact.review_status}</Badge>
      </header>
      {artifact.summary ? (
        <p className="text-sm text-muted-foreground">{artifact.summary}</p>
      ) : null}
      {groups.length === 0 ? (
        <EmptyState title="This artifact has no items" size="compact" />
      ) : (
        groups.map((group) => (
          <section key={group.kind} aria-label={group.kind} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.kind}
            </h2>
            <Table>
              <TableCaption className="sr-only">
                {group.kind} items of {artifactTitle(artifact)}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${encodeURIComponent(projectId)}/artifacts/${encodeURIComponent(artifactId)}/${encodeURIComponent(item.id)}`}
                        className="static z-0 font-mono text-sm underline-offset-2 hover:underline"
                      >
                        {item.key}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-80 truncate">
                      {typeof item.content.title === 'string'
                        ? item.content.title
                        : typeof item.content.name === 'string'
                          ? item.content.name
                          : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.review_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))
      )}
    </article>
  )
}
