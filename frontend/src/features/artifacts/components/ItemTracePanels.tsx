'use client'

import Link from 'next/link'

import { ErrorState, LoadingState } from '@/components/state'
import { useNow } from '@/hooks/useNow'
import { formatRelativeTime } from '@/lib/relative-time.utils'

import { useItemRevisions } from '../hooks/useItemRevisions'
import { useItemTrace } from '../hooks/useItemTrace'

interface PanelProps {
  itemId: string
}

/** TRACE (skeletons §5): the links of the item by type, outgoing then
 * incoming; `!` marks a link made from an older version of the target. */
export function ItemTracePanel({ itemId, projectId }: PanelProps & { projectId: string }) {
  const trace = useItemTrace(itemId)

  if (trace.isPending) {
    return <LoadingState label="Loading the trace" rows={2} size="compact" />
  }
  if (trace.isError) {
    return (
      <ErrorState
        message={trace.error.message}
        onRetry={() => void trace.refetch()}
        size="compact"
      />
    )
  }
  const outgoing = trace.data.links.filter((link) => link.source.id === itemId)
  const incoming = trace.data.links.filter((link) => link.target.id === itemId)
  if (outgoing.length === 0 && incoming.length === 0) {
    return <p className="px-1 py-2 text-xs text-muted-foreground">No links yet.</p>
  }
  const versions = new Map(trace.data.nodes.map((node) => [node.id, node]))
  return (
    <dl className="flex flex-col gap-2 px-1 py-2 text-xs">
      {outgoing.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          <dt className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
            Outgoing
          </dt>
          {outgoing.map((link) => (
            <dd key={link.id} className="flex items-baseline gap-2">
              <span className="font-mono text-muted-foreground">{link.link_type}</span>
              <Link
                href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(link.target.id)}`}
                className="font-mono underline underline-offset-2"
              >
                {link.target.key}
              </Link>
            </dd>
          ))}
        </div>
      ) : null}
      {incoming.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          <dt className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
            Incoming
          </dt>
          {incoming.map((link) => (
            <dd key={link.id} className="flex items-baseline gap-2">
              <Link
                href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(link.source.id)}`}
                className="font-mono underline underline-offset-2"
              >
                {link.source.key}
              </Link>
              <span className="font-mono text-muted-foreground">{link.link_type}</span>
              {versions.get(link.source.id)?.review_status === 'superseded' ||
              link.target_version < 1 ? (
                <span
                  title="made from an older version"
                  className="text-warning-strong"
                  aria-label="needs review"
                >
                  !
                </span>
              ) : null}
            </dd>
          ))}
        </div>
      ) : null}
    </dl>
  )
}

/** TIMELINE (skeletons §5): the revisions of the item, newest first. */
export function ItemTimelinePanel({ itemId }: PanelProps) {
  const revisions = useItemRevisions(itemId)
  const now = useNow()

  if (revisions.isPending) {
    return <LoadingState label="Loading the timeline" rows={2} size="compact" />
  }
  if (revisions.isError) {
    return (
      <ErrorState
        message={revisions.error.message}
        onRetry={() => void revisions.refetch()}
        size="compact"
      />
    )
  }
  if (revisions.data.length === 0) {
    return <p className="px-1 py-2 text-xs text-muted-foreground">No revisions yet.</p>
  }
  return (
    <ol className="flex flex-col gap-1.5 px-1 py-2 text-xs">
      {revisions.data.map((entry) => (
        <li key={String(entry.version)} className="flex items-baseline gap-2">
          <span className="font-mono">v{String(entry.version)}</span>
          <span className="text-muted-foreground">{entry.change_reason}</span>
          <time
            dateTime={entry.created_at}
            className="ml-auto shrink-0 text-muted-foreground"
          >
            {formatRelativeTime(entry.created_at, now)}
          </time>
        </li>
      ))}
    </ol>
  )
}
