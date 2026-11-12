'use client'

import { PencilIcon, PlusIcon } from 'lucide-react'

import type { KindGroup as KindGroupData } from '@/modules/activity/entities'
import { useItem, useItemSchema } from '@/modules/artifact/entities'
import { workMessages } from '@/modules/run/entities'
import { itemTitle } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { Trace, TraceIcon, TraceLine, TraceTitle } from '@/shared/components/ui/trace'
import { useView } from '@/shared/lib/view'
import { routes } from '@/shared/routes'

import { useRunActivity } from '../hooks/useRunActivity'
import { RowButton } from './RowButton'

/**
 * What a phase wrote, under its notes: in the user view, its words and one row for each item of
 * a kind that open the item; in the developer view, a line for each item with its key and version.
 */
export function WrittenEntryView({ kindGroups }: { kindGroups: readonly KindGroupData[] }) {
  const { projectId } = useRunActivity()
  const view = useView()
  const openPage = useOpenPage()

  if (view === 'user') {
    return (
      <div className="flex flex-col gap-4">
        {kindGroups.map((group) => (
          <KindGroup key={group.kind} group={group} projectId={projectId} openPage={openPage} />
        ))}
      </div>
    )
  }
  return (
    <Trace>
      {kindGroups.flatMap(({ created, changed }) => [
        ...created.map((item) => (
          <TraceLine key={`+${item.item_id}`} color="neutral">
            <TraceIcon>
              <PlusIcon />
            </TraceIcon>
            <TraceTitle>
              {item.key} v{String(item.version)}
            </TraceTitle>
          </TraceLine>
        )),
        ...changed.map((item) => (
          <TraceLine key={`~${item.item_id}`} color="neutral">
            <TraceIcon>
              <PencilIcon />
            </TraceIcon>
            <TraceTitle>
              {item.key} v{String(item.version)}
            </TraceTitle>
          </TraceLine>
        )),
      ])}
    </Trace>
  )
}

/** One kind of item a phase wrote, in the user view: its words, then one row per item. */
function KindGroup({
  group,
  projectId,
  openPage,
}: {
  group: KindGroupData
  projectId: string
  openPage: ReturnType<typeof useOpenPage>
}) {
  const items = [...group.created, ...group.changed]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-base text-muted-foreground">
        {workMessages.kindWrites(group.title, group.created.length, group.changed.length)}
      </p>
      {/* However many the phase wrote, the list keeps to one height and scrolls. */}
      <div className="flex max-h-56 flex-col overflow-y-auto rounded-xl border bg-card p-1.5">
        {items.map((item) => (
          <WrittenItem
            key={item.item_id}
            reference={item}
            projectId={projectId}
            openPage={openPage}
          />
        ))}
      </div>
    </div>
  )
}

/** One item a phase wrote: its title, on a row of its own that opens the item. */
function WrittenItem({
  reference,
  projectId,
  openPage,
}: {
  reference: { item_id: string; key: string; version: number }
  projectId: string
  openPage: ReturnType<typeof useOpenPage>
}) {
  const item = useItem(reference.item_id, reference.version)
  const { schema } = useItemSchema(item.data)
  return (
    <RowButton
      className="shrink-0"
      onClick={() => {
        openPage(routes.project(projectId).item(reference.item_id))
      }}
    >
      <span className="min-w-0 truncate text-sm">
        {item.data === undefined ? reference.key : itemTitle(schema, item.data)}
      </span>
    </RowButton>
  )
}
