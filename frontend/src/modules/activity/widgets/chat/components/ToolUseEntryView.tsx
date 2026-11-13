'use client'

import type { LucideIcon } from 'lucide-react'
import { SearchIcon, WrenchIcon } from 'lucide-react'

import type { ToolUse } from '@/modules/run/entities'
import { workMessages } from '@/modules/run/entities'
import type { Tool } from '@/modules/workflow/entities'
import { toolUsesLine, useTools } from '@/modules/workflow/entities'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/components/ui/trace'

import { activityChatMessages } from '../activity-chat.constants'
import { useOpenWhileWorking } from '../hooks/useOpenWhileWorking'
import { useRunActivity } from '../hooks/useRunActivity'
import { StepNoteLine } from './StepNoteLine'

// The mark that a definition may name for a tool, looked up by its name. A tool that names none or
// is not listed is most often a lookup, so it takes the magnifier.
const toolMarks = {
  search: SearchIcon,
  tool: WrenchIcon,
} as const satisfies Record<Tool['icon'], LucideIcon>

/**
 * The use of a tool by an agent, as an entry between the lines of its work: the words of the
 * definition for the uses in a row, opening to a note for each. It is open while the tool is in
 * use, with its last note shimmering, and closed again once something else follows.
 */
export function ToolUseEntryView({ use }: { use: ToolUse }) {
  const { run } = useRunActivity()
  const tools = useTools(run.workflow_version)
  const tool = tools.get(use.tool)
  const [open, setOpen] = useOpenWhileWorking(use.isRunning)
  const lastNote = use.notes.at(-1)
  const Mark = toolMarks[tool?.icon ?? 'search']
  const line =
    tool === undefined
      ? workMessages.unknownToolUses(use.tool, use.notes.length)
      : toolUsesLine(tool, use.notes.length)

  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger aria-label={activityChatMessages.showDetails}>
        <TraceLine color="chart" {...(use.isRunning && { status: 'running' as const })}>
          <TraceIcon>
            <Mark />
          </TraceIcon>
          <TraceTitle>{line}</TraceTitle>
          {/* While it is closed, the line says what the last use looked up. */}
          {!open && lastNote !== undefined && (
            <TraceDescription className="min-w-0 shrink truncate">{lastNote.text}</TraceDescription>
          )}
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <div className="flex min-w-0 flex-col gap-1">
          {use.notes.map((note, index) => (
            <StepNoteLine
              key={index}
              note={note}
              hasMark={false}
              inProgress={use.isRunning && index === use.notes.length - 1}
            />
          ))}
        </div>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
