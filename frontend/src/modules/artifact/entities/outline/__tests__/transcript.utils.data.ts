import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import type { OutlineItem } from '@/modules/artifact/entities'
import type { ContentSchema, ContentValues } from '@/modules/workflow/entities'

/** A kind of item that says who speaks a message of a transcript, and which words it says. */
export const messageSchema: ContentSchema = {
  title: 'Message',
  'x-level': 'item',
  'x-kind': 'message',
  'x-ui-display': 'transcript',
  'x-ui-title-field': 'content',
  'x-ui-role-field': 'speaker',
  properties: {
    turn: { type: 'integer', 'x-ui-widget': 'separator', minimum: 1 },
    speaker: { type: 'string', 'x-ui-widget': 'text' },
    content: { type: 'string', 'x-ui-widget': 'textarea' },
    iteration: { type: 'integer', 'x-ui-widget': 'number' },
  },
}

/** A kind of item that names no field of its own: the transcript reads its key as the speaker. */
export const messageSchemaWithoutRole: ContentSchema = {
  title: 'Message',
  'x-level': 'item',
  'x-kind': 'message',
  'x-ui-display': 'transcript',
  'x-ui-title-field': 'content',
  properties: {
    turn: { type: 'integer', 'x-ui-widget': 'separator', minimum: 1 },
    content: { type: 'string', 'x-ui-widget': 'textarea' },
  },
}

/** The items of the interview with the student of the mentor platform, in the order of the outline. */
export function interviewItems(): OutlineItem[] {
  const keys = [
    'PER-001#1',
    'PER-001#2',
    'PER-001#3',
    'PER-001#4',
    'PER-001#5',
    'PER-001#6',
    'PER-001#7',
    'PER-001#8',
  ]
  return keys.map((key) => {
    const item = itemFixtureByKey(projectIds.mentor, key)
    return { ...item, depth: 1 }
  })
}

/** A message of a conversation with this id and content. */
export function messageOf(id: string, content: ContentValues): OutlineItem {
  const base = itemFixtureByKey(projectIds.mentor, 'PER-001#1')
  return { ...base, id, key: id, content, depth: 1 }
}

/** The participants of a conversation of four: the one who leads, two who share its role, one who does not. */
export const fourParticipants = [
  { key: 'interviewer', name: 'Interviewer', itemId: null, side: 'end', tone: 'primary' },
  { key: 'mentor', name: 'Mentor', itemId: 'item-2', side: 'end', tone: 'chart' },
  { key: 'admin', name: 'Admin', itemId: 'item-3', side: 'start', tone: 'neutral' },
  { key: 'student', name: 'Student', itemId: 'item-4', side: 'start', tone: 'chart' },
] as const
