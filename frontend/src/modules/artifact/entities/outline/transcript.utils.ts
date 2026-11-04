import {
  contentFields,
  type ContentSchema,
  type ContentValues,
  extensionField,
  extensionFieldText,
  isSeparatorField,
  nonStatusTone,
} from '@/modules/workflow/entities/@x/artifact'
import { isSameValue } from '@/shared/lib/collections'
import { isRecord, isString } from '@/shared/lib/guards'

import type { OutlineItem } from '../items/items.types'
import type { Participant, TranscriptPart } from './outline.types'

/**
 * The participants that the field of `x-ui-participants-field` lists, each with its side and its
 * tone; none without the keyword. The participants who share the role of the first, who leads, sit
 * at the right of the conversation, the others at the left.
 */
export function transcriptParticipants(
  schema: ContentSchema,
  content: ContentValues,
): Participant[] {
  const field = extensionField(schema, 'x-ui-participants-field')
  const list = field === undefined ? undefined : content[field.name]
  if (!Array.isArray(list)) return []
  const entries = list.filter(isRecord)
  const leader = entries[0]
  const leaderRole = leader !== undefined && isString(leader.role) ? leader.role : null
  return entries.flatMap((entry, place) => {
    const key = isString(entry.key) ? entry.key : null
    const name = isString(entry.name) ? entry.name : null
    if (key === null || name === null) return []
    return [
      {
        key,
        name,
        itemId: isString(entry.item_id) ? entry.item_id : null,
        side: isString(entry.role) && entry.role === leaderRole ? 'end' : 'start',
        tone: nonStatusTone(place),
      },
    ]
  })
}

/** The run of messages that is being built by `transcriptParts`. */
interface RunPart {
  participant: Participant
  messages: { item: OutlineItem; text: string }[]
}

/**
 * The parts of a conversation in order: a separator before the first message and where a field
 * with the widget separator changes, and a run for each row of messages of one speaker. A speaker
 * that is not a participant gets one: its key as its name, at the start, neutral.
 */
export function transcriptParts(
  schema: ContentSchema,
  items: readonly OutlineItem[],
  participants: readonly Participant[],
): TranscriptPart[] {
  const byKey = new Map(participants.map((participant) => [participant.key, participant]))
  const separatorFields = contentFields(schema).filter(isSeparatorField)
  const parts: TranscriptPart[] = []
  let run: RunPart | null = null
  let before: ContentValues | null = null

  const closeRun = () => {
    if (run === null) return
    const first = run.messages[0]
    parts.push({ type: 'run', key: `run:${first?.item.id ?? ''}`, ...run })
    run = null
  }

  for (const item of items) {
    // A separator holds the fields that change at this message; a change of speaker alone breaks
    // the run without one.
    const changed = separatorFields.filter(
      (field) => !isSameValue(before?.[field.name] ?? null, item.content[field.name] ?? null),
    )
    if (changed.length > 0) {
      closeRun()
      parts.push({
        type: 'separator',
        key: `separator:${item.id}`,
        fields: changed,
        content: item.content,
      })
    }

    const speaker = extensionFieldText(schema, item, 'x-ui-role-field') || item.key
    const text = extensionFieldText(schema, item, 'x-ui-title-field')
    if (run !== null && run.participant.key === speaker) {
      run.messages.push({ item, text })
    } else {
      closeRun()
      run = {
        participant: byKey.get(speaker) ?? {
          key: speaker,
          name: speaker,
          itemId: null,
          side: 'start',
          tone: 'neutral',
        },
        messages: [{ item, text }],
      }
    }
    before = item.content
  }
  closeRun()
  return parts
}
