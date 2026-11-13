'use client'

import { type KindGroup as KindGroupData, useReferenceOpener } from '@/modules/activity/entities'
import { useItem, useItemSchema } from '@/modules/artifact/entities'
import { workMessages } from '@/modules/run/entities'
import { itemTitle } from '@/modules/workflow/entities'

import { RowButton } from './RowButton'

/**
 * What a phase wrote, under its notes: its words and one row for each item of a kind that has
 * pages, which open the item.
 */
export function WrittenEntryView({ kindGroups }: { kindGroups: readonly KindGroupData[] }) {
  return (
    <div className="flex flex-col gap-4">
      {kindGroups.map((group) => (
        <KindGroup key={group.kind} group={group} />
      ))}
    </div>
  )
}

/** One kind of item a phase wrote: its words, then one row per item. */
function KindGroup({ group }: { group: KindGroupData }) {
  const items = [...group.created, ...group.changed]
  const words = workMessages.kindWrites(group.title, group.created.length, group.changed.length)
  // The items of a kind without pages, such as the turns of an interview, are short and many, and
  // none opens by itself: the line that counts them is all the chat shows of them.
  if (!group.isNavigable) return <p className="text-sm text-muted-foreground">{words}</p>
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{words}</p>
      {/* However many the phase wrote, the list keeps to one height and scrolls. */}
      <div className="flex max-h-56 flex-col overflow-y-auto rounded-xl border bg-card p-1.5">
        {items.map((item) => (
          <WrittenItem key={item.item_id} reference={item} />
        ))}
      </div>
    </div>
  )
}

/** One item a phase wrote: its title, on a row of its own that opens the item. */
function WrittenItem({
  reference,
}: {
  reference: { item_id: string; key: string; version: number }
}) {
  const item = useItem(reference.item_id, reference.version)
  const { schema } = useItemSchema(item.data)
  const open = useReferenceOpener({ kind: 'item', itemId: reference.item_id })
  return (
    <RowButton className="shrink-0" disabled={open === null} onClick={open ?? undefined}>
      <span className="min-w-0 truncate text-sm">
        {item.data === undefined ? reference.key : itemTitle(schema, item.data)}
      </span>
    </RowButton>
  )
}
