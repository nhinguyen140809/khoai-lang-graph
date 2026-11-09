'use client'

import { OpenInNewTabButton } from '@/modules/artifact/features/open-item'
import { useIsProjectWriting, useProjectId } from '@/modules/project/entities'
import {
  type CoverageItem,
  hasALinkTo,
  linkTypeWords,
  liveTraceMs,
  useTraceabilityCoverage,
} from '@/modules/trace/entities'
import { ViewTraceButton } from '@/modules/trace/features/view-trace'
import { useKindTitles, useLinkTitleOf } from '@/modules/workflow/entities'
import { PageLink, useEditorTab } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Badge } from '@/shared/components/ui/badge'
import { Item, ItemContent } from '@/shared/components/ui/item'
import { RecordName } from '@/shared/components/ui/record-name'
import { snakeToSentenceCase } from '@/shared/lib/text'
import { routes } from '@/shared/routes'

import { gapPageMessages } from './gap-page.constants'

/**
 * The items of one gap of the coverage, in a tab named after the gap: each is a card of its own.
 * A key that the coverage does not list is a gap that holds no item, so its page opens as usual,
 * named after the key, and says that its list is empty.
 */
export function GapPage({ projectId, gapKey }: { projectId: string; gapKey: string }) {
  const isWriting = useIsProjectWriting(projectId)
  const coverage = useTraceabilityCoverage(projectId, {
    refetchInterval: isWriting ? liveTraceMs : false,
  })
  const kindTitles = useKindTitles()
  const linkTitleOf = useLinkTitleOf()

  const gap = coverage.data?.gaps.find((found) => found.key === gapKey)
  const title = gap?.title ?? snakeToSentenceCase(gapKey)

  useEditorTab({
    id: `gap:${gapKey}`,
    title: coverage.data === undefined ? gapPageMessages.tabFallback : title,
    href: routes.project(projectId).traceGap(gapKey),
  })

  if (coverage.isError) {
    return (
      <ErrorState
        message={gapPageMessages.loadError}
        onRetry={() => {
          void coverage.refetch()
        }}
      />
    )
  }
  if (coverage.data === undefined) return <LoadingState label={gapPageMessages.loading} />

  const items = gap?.items ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6 pb-20">
      <header className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-semibold">
          {title}
          <Badge variant="soft" color="primary">
            {String(items.length)}
          </Badge>
        </h1>
        {gap !== undefined && <p className="text-sm text-muted-foreground">{gap.description}</p>}
      </header>
      {items.length === 0 ? (
        <EmptyState title={gapPageMessages.empty} />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.item_id}>
              <GapRow item={item} kindTitles={kindTitles} linkTitleOf={linkTitleOf} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * One item of a gap as a card: its kind and title on top, large, with the icon buttons that open
 * it and its trace at the end of that line; and, for each target of its links that changed after
 * the link was made, a box of its own under it. The box names what the item is based on, the item
 * in bold, and how far it moved as two badges, or that it was replaced, so the card reads from the
 * item down to the change.
 */
function GapRow({
  item,
  kindTitles,
  linkTitleOf,
}: {
  item: CoverageItem
  kindTitles: ReadonlyMap<string, string>
  /** The title of the type of a link, as the definition names it. */
  linkTitleOf: (linkType: string) => string
}) {
  const projectId = useProjectId()
  const project = routes.project(projectId)

  return (
    <Item variant="outline">
      <ItemContent className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-xs text-muted-foreground">
              {kindTitles.get(item.kind) ?? item.kind}
            </span>
            <span className="block text-base font-semibold">{item.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ViewTraceButton projectId={projectId} itemId={item.item_id} title={item.title} />
            <OpenInNewTabButton projectId={projectId} itemId={item.item_id} title={item.title} />
          </div>
        </div>
        {item.changed_targets?.map((changed) => (
          <Item key={changed.target.item_id} variant="muted" size="sm">
            <ItemContent>
              <span className="text-xs text-muted-foreground">
                {gapPageMessages.it}{' '}
                {
                  (linkTypeWords[changed.link_type] ?? hasALinkTo(linkTitleOf(changed.link_type)))
                    .now
                }
              </span>
              <PageLink
                href={project.item(changed.target.item_id)}
                className="no-underline hover:no-underline"
              >
                <RecordName
                  kind={kindTitles.get(changed.target.kind) ?? changed.target.kind}
                  title={changed.target.title}
                  layout="line"
                  className="text-sm font-semibold"
                />
              </PageLink>
              <span className="flex flex-wrap gap-1.5 pt-1">
                {changed.made_from_version === changed.current_version ? (
                  // The item kept its version, so what moved is not its content: it was replaced.
                  <Badge variant="soft" color="warning">
                    {gapPageMessages.replaced}
                  </Badge>
                ) : (
                  <>
                    <Badge variant="outline" color="neutral">
                      {gapPageMessages.madeFrom(changed.made_from_version)}
                    </Badge>
                    <Badge variant="soft" color="warning">
                      {gapPageMessages.now(changed.current_version)}
                    </Badge>
                  </>
                )}
              </span>
            </ItemContent>
          </Item>
        ))}
      </ItemContent>
    </Item>
  )
}
