'use client'

import { UserRoundIcon } from 'lucide-react'

import { useItemHref } from '@/modules/artifact/entities'
import { OpenInNewTabButton } from '@/modules/artifact/features/open-item'
import { useIsProjectWriting, useProjectId } from '@/modules/project/entities'
import {
  liveTraceMs,
  type OpenIssueEntry,
  type OpenIssueGroup,
  QuotedItemCard,
  useOpenIssues,
} from '@/modules/trace/entities'
import { ViewTraceButton } from '@/modules/trace/features/view-trace'
import {
  type ContentSchema,
  useContentSchemas,
  useItemTitleOf,
  useKindTitles,
  useLinkTitleOf,
} from '@/modules/workflow/entities'
import { useEditorTab } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { Item, ItemContent, ItemTitle } from '@/shared/components/ui/item'
import { routes } from '@/shared/routes'

import { openIssuesMessages } from '../open-issues.constants'

/**
 * The open issues of the project, one section per kind with its count and one card per issue:
 * the problem, where it applies with the words it quotes, the people a disagreement involves,
 * and the ways to open the issue or to see the trace of one of its items.
 */
export function OpenIssuesPage({ projectId }: { projectId: string }) {
  const isWriting = useIsProjectWriting(projectId)
  const issues = useOpenIssues(projectId, { refetchInterval: isWriting ? liveTraceMs : false })
  const schemas = useContentSchemas()
  const kindTitles = useKindTitles()

  useEditorTab({
    id: 'trace:issues',
    title: openIssuesMessages.title,
    href: routes.project(projectId).traceIssues(),
  })

  if (issues.state === 'error') {
    return (
      <ErrorState
        message={openIssuesMessages.title}
        onRetry={() => {
          issues.retry()
        }}
      />
    )
  }
  if (issues.state === 'pending') return <LoadingState label={openIssuesMessages.title} />
  if (issues.count === 0) {
    return (
      <EmptyState
        title={openIssuesMessages.empty.title}
        description={openIssuesMessages.empty.description}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 pb-20">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{openIssuesMessages.title}</h1>
        <p className="text-sm text-muted-foreground">{openIssuesMessages.description}</p>
      </header>
      {issues.groups.map((group) => (
        <IssueSection key={group.kind} group={group} kindTitles={kindTitles} schemas={schemas} />
      ))}
    </div>
  )
}

/** One kind of issue with its count and its cards. */
function IssueSection({
  group,
  kindTitles,
  schemas,
}: {
  group: OpenIssueGroup
  kindTitles: ReadonlyMap<string, string>
  schemas: ReadonlyMap<string, ContentSchema>
}) {
  return (
    <section className="space-y-3" aria-label={group.kindTitle}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {kindTitles.get(group.kind) ?? group.kindTitle}
        <Badge variant="soft" color="primary">
          {String(group.entries.length)}
        </Badge>
      </h2>
      <div className="space-y-3">
        {group.entries.map((entry) => (
          <IssueCard key={entry.issue.id} entry={entry} kindTitles={kindTitles} schemas={schemas} />
        ))}
      </div>
    </section>
  )
}

/**
 * One open issue, as tall as it needs and no more: its title in bold with the mark of a question
 * that is open, the problem only when it says more than the title does, the items it concerns
 * each in a card of its own with the words it quotes, and the people a disagreement involves. The
 * kind of the issue stays in the heading of the section, and the page holds open issues only, so
 * no badge says it, and no icon marks it, as no other card has one. The two ways out are icon
 * buttons at the end of the title line.
 */
function IssueCard({
  entry,
  kindTitles,
  schemas,
}: {
  entry: OpenIssueEntry
  kindTitles: ReadonlyMap<string, string>
  schemas: ReadonlyMap<string, ContentSchema>
}) {
  const projectId = useProjectId()
  const hrefOf = useItemHref(projectId)
  const linkTitleOf = useLinkTitleOf()
  const titleOf = useItemTitleOf()
  const issueTitle = titleOf(entry.issue)
  // The trace is the one of the item the issue is about, or of the issue itself when it is about
  // none; the title names the tab only when it is the title of the item that is traced.
  const subject = entry.subjects[0]?.item
  const traced =
    subject === undefined ? { id: entry.issue.id, title: issueTitle } : { id: subject.id }

  return (
    <Item variant="outline">
      <ItemContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <ItemTitle className="min-w-0 text-base font-semibold">{issueTitle}</ItemTitle>
          <div className="flex shrink-0 items-center gap-0.5">
            <ViewTraceButton projectId={projectId} itemId={traced.id} title={traced.title} />
            <OpenInNewTabButton projectId={projectId} itemId={entry.issue.id} title={issueTitle} />
          </div>
        </div>
        {entry.problem !== issueTitle && <p className="text-sm">{entry.problem}</p>}
        {entry.subjects.map(({ item, link }) => (
          <div key={item.id} className="space-y-1.5">
            {/* The title of the link, from the definition, says how the issue relates to the item. */}
            <p className="text-xs font-semibold text-muted-foreground">
              {linkTitleOf(link.link_type)}
            </p>
            <QuotedItemCard
              href={hrefOf(item)}
              kind={kindTitles.get(item.kind) ?? item.kind}
              item={{ key: item.key, content: item.content, schema: schemas.get(item.kind) }}
              quote={link.target_quote}
              side="target"
            />
          </div>
        ))}
        {entry.sides.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.sides.map((side) => (
              <Badge key={side.id} variant="outline" color="neutral">
                <UserRoundIcon aria-hidden className="size-3" />
                {side.key}
              </Badge>
            ))}
          </div>
        )}
      </ItemContent>
    </Item>
  )
}
