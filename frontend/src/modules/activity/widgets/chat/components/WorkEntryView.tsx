'use client'

import { PencilIcon, PlusIcon } from 'lucide-react'

import type { ActivityEntry } from '@/modules/activity/entities'
import { useItem, useItemSchema } from '@/modules/artifact/entities'
import type { WorkEntry } from '@/modules/run/entities'
import { useWorkStatusLook, useWorkWords, workMessages } from '@/modules/run/entities'
import { itemTitle } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/components/ui/trace'
import { useView } from '@/shared/lib/view'
import { routes } from '@/shared/routes'

import { activityChatMessages } from '../activity-chat.constants'
import { useRunActivity } from '../hooks/useRunActivity'

interface WorkEntryViewProps {
  work: WorkEntry
  stageTitle: string | null
  subjectTitle: string | null
  kindGroups: Extract<ActivityEntry, { type: 'work' }>['kindGroups']
}

/** A line of work of the agents: what it did, in words, and what it wrote when it is open. */
export function WorkEntryView({ work, stageTitle, subjectTitle, kindGroups }: WorkEntryViewProps) {
  const { run, projectId } = useRunActivity()
  const look = useWorkStatusLook(work.status)
  const words = useWorkWords(work, run)
  const view = useView()
  const openPage = useOpenPage()
  const Mark = look.icon
  const title =
    view === 'user'
      ? [stageTitle, subjectTitle].filter((part) => part !== null).join(': ')
      : `${work.node}${subjectTitle === null ? '' : `: ${subjectTitle}`}`

  if (kindGroups.length === 0) {
    return (
      <TraceLine {...(look.traceStatus !== null && { status: look.traceStatus })} color={look.tone}>
        <TraceIcon>
          <Mark aria-hidden />
        </TraceIcon>
        <TraceTitle>{title}</TraceTitle>
        <WorkWordsLine words={words} />
      </TraceLine>
    )
  }

  return (
    <TraceCollapsible>
      <div className="flex w-full min-w-0 items-start gap-2">
        <TraceCollapsibleTrigger
          aria-label={activityChatMessages.showWrites}
          className="min-w-0 flex-1"
        >
          <TraceLine
            {...(look.traceStatus !== null && { status: look.traceStatus })}
            color={look.tone}
          >
            <TraceIcon>
              <Mark />
            </TraceIcon>
            <TraceTitle>{title}</TraceTitle>
            <WorkWordsLine words={words} />
          </TraceLine>
        </TraceCollapsibleTrigger>
      </div>
      <TraceCollapsibleContent>
        {view === 'user' ? (
          <div className="flex flex-col gap-1">
            {kindGroups.map((group) => (
              <KindGroup key={group.kind} group={group} projectId={projectId} openPage={openPage} />
            ))}
          </div>
        ) : (
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
        )}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}

/** The words of a line of work, each in its own part; Stop on the running line of the latest run. */
function WorkWordsLine({ words }: { words: ReturnType<typeof useWorkWords> }) {
  return (
    <>
      <TraceDescription className="flex flex-wrap gap-x-2">
        {[words.status, words.round, words.took, words.writes, ...words.details]
          .filter((part): part is string => part !== null)
          .map((part, index) => (
            <span key={index}>{part}</span>
          ))}
      </TraceDescription>
      {words.failure !== null && (
        <span className="block text-xs text-destructive">{words.failure}</span>
      )}
    </>
  )
}

/** One kind of item a line wrote, in the user view: its words, then one row per item. */
function KindGroup({
  group,
  projectId,
  openPage,
}: {
  group: Extract<ActivityEntry, { type: 'work' }>['kindGroups'][number]
  projectId: string
  openPage: ReturnType<typeof useOpenPage>
}) {
  const items = [...group.created, ...group.changed]
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">
        {workMessages.kindWrites(group.title, group.created.length, group.changed.length)}
      </p>
      {items.map((item) => (
        <WrittenItem
          key={item.item_id}
          reference={item}
          projectId={projectId}
          openPage={openPage}
        />
      ))}
    </div>
  )
}

/** One item a line wrote: its title, on a row of its own that opens the item. */
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
    <Button
      variant="ghost"
      size="xs"
      className="h-auto justify-start py-0.5 pl-0 font-normal"
      onClick={() => {
        openPage(routes.project(projectId).item(reference.item_id))
      }}
    >
      <span className="truncate">
        {item.data === undefined ? reference.key : itemTitle(schema, item.data)}
      </span>
    </Button>
  )
}
