'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowRightIcon, BrainIcon, LightbulbIcon, PencilIcon, PlusIcon } from 'lucide-react'

import type { ActivityEntry } from '@/modules/activity/entities'
import { useItem, useItemSchema } from '@/modules/artifact/entities'
import type { StepNote, StepNoteKind, WorkEntry } from '@/modules/run/entities'
import {
  isWorkStatusInProgress,
  useWorkStatusLook,
  useWorkWords,
  visibleNotes,
  workMessages,
} from '@/modules/run/entities'
import { itemTitle } from '@/modules/workflow/entities'
import { useOpenPage } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import { Markdown } from '@/shared/components/ui/markdown'
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
import { useOpenWhileWorking } from '../hooks/useOpenWhileWorking'
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
  const notes = visibleNotes(work.notes, view)
  const [open, setOpen] = useOpenWhileWorking(isWorkStatusInProgress(work.status))
  const Mark = look.icon
  const title =
    view === 'user'
      ? [stageTitle, subjectTitle].filter((part) => part !== null).join(': ')
      : `${work.node}${subjectTitle === null ? '' : `: ${subjectTitle}`}`

  if (kindGroups.length === 0 && notes.length === 0) {
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
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <div className="flex w-full min-w-0 items-start gap-2">
        <TraceCollapsibleTrigger
          aria-label={activityChatMessages.showDetails}
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
        <StepNotes notes={notes} running={isWorkStatusInProgress(work.status)} />
        {view === 'user' ? (
          <div className="flex flex-col gap-1 not-first:mt-2 first:mt-0">
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

// The mark of each kind of note, looked up by the kind instead of branched on, so that a new kind
// fails to compile until it has a mark.
const noteMarks = {
  doing: ArrowRightIcon,
  finding: LightbulbIcon,
  thinking: BrainIcon,
} as const satisfies Record<StepNoteKind, LucideIcon>

/**
 * What a line of work noted while it worked, in its open part, one line for each note in the order
 * written: a mark for its kind, then its Markdown, in the text colour for what it found and muted
 * for the rest. While the line is running, its last note, when it says what the line is doing,
 * shimmers like the title of the line, so the one thing in progress reads at a glance.
 */
function StepNotes({ notes, running }: { notes: readonly StepNote[]; running: boolean }) {
  if (notes.length === 0) {
    return null
  }
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {notes.map((note, index) => {
        const Mark = noteMarks[note.kind]
        const isInProgress = running && index === notes.length - 1 && note.kind === 'doing'
        return (
          <div
            key={index}
            data-kind={note.kind}
            {...(isInProgress && { 'data-status': 'running' })}
            className="flex min-w-0 items-start gap-2 text-muted-foreground data-[kind=finding]:text-foreground"
          >
            <Mark aria-hidden className="mt-1 size-4 shrink-0" />
            <div className="min-w-0 flex-1 in-data-[status=running]:shimmer motion-reduce:shimmer-none">
              <Markdown>{note.text}</Markdown>
            </div>
          </div>
        )
      })}
    </div>
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
