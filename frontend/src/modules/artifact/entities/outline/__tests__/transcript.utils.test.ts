import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import type { ContentSchema } from '@/modules/workflow/entities'

import { transcriptParticipants, transcriptParts } from '../transcript.utils'
import {
  fourParticipants,
  interviewItems,
  messageOf,
  messageSchema,
  messageSchemaWithoutRole,
} from './transcript.utils.data'

const interview = artifactFixtureByKind(
  projectIds.mentor,
  'interview_transcript',
  'Interview with Minh',
)
const transcriptSchema = contentSchemaFixtureByKind('interview_transcript')

/** The shape of the parts of a conversation: the fields of a separator, the speaker of a run. */
function shapeOf(parts: ReturnType<typeof transcriptParts>) {
  return parts.map((part) =>
    part.type === 'separator'
      ? { type: part.type, fields: part.fields.map(({ name }) => name) }
      : { type: part.type, speaker: part.participant.key, count: part.messages.length },
  )
}

describe('transcriptParticipants', () => {
  it('reads the entries in order, each with its item and the tone of its place', () => {
    const participants = transcriptParticipants(transcriptSchema, interview.content)
    const persona = itemFixtureByKey(projectIds.mentor, 'PER-001')

    expect(participants.map(({ key, name, itemId }) => [key, name, itemId])).toEqual([
      ['interviewer', 'Interviewer', null],
      ['PER-001', 'Minh', persona.id],
    ])
    expect(participants.map(({ tone }) => tone)).toEqual(['primary', 'chart'])
  })

  it('sits the participants who share the role of the first at the right, the others at the left', () => {
    const participants = transcriptParticipants(transcriptSchema, {
      participants: [
        { key: 'moderator', name: 'Moderator', role: 'interviewer', item_id: null },
        { key: 'mentor', name: 'Mentor', role: 'interviewer', item_id: null },
        { key: 'student', name: 'Student', role: 'persona', item_id: null },
      ],
    })

    expect(participants.map(({ key, side, tone }) => [key, side, tone])).toEqual([
      ['moderator', 'end', 'primary'],
      ['mentor', 'end', 'chart'],
      ['student', 'start', 'accent'],
    ])
  })

  it('gives no participant without the keyword', () => {
    expect(transcriptParticipants(contentSchemaFixtureByKind('requirements_analysis'), {})).toEqual(
      [],
    )
  })
})

describe('transcriptParts', () => {
  it('separates before the first message and wherever the turn changes, not where only the speaker changes', () => {
    const parts = transcriptParts(messageSchema, interviewItems(), [
      { key: 'interviewer', name: 'Interviewer', itemId: null, side: 'end', tone: 'primary' },
      { key: 'PER-001', name: 'Minh', itemId: null, side: 'start', tone: 'chart' },
    ])

    expect(shapeOf(parts)).toEqual([
      { type: 'separator', fields: ['turn'] },
      { type: 'run', speaker: 'interviewer', count: 1 },
      { type: 'run', speaker: 'PER-001', count: 1 },
      { type: 'separator', fields: ['turn'] },
      { type: 'run', speaker: 'interviewer', count: 1 },
      { type: 'run', speaker: 'PER-001', count: 1 },
      { type: 'separator', fields: ['turn'] },
      { type: 'run', speaker: 'interviewer', count: 1 },
      { type: 'run', speaker: 'PER-001', count: 1 },
      { type: 'separator', fields: ['turn'] },
      { type: 'run', speaker: 'interviewer', count: 1 },
      { type: 'run', speaker: 'PER-001', count: 1 },
    ])
  })

  it('holds the separator fields that change at one message in one part', () => {
    const schema: ContentSchema = {
      ...messageSchema,
      properties: {
        turn: { type: 'integer', 'x-ui-widget': 'separator' },
        round: { type: 'integer', 'x-ui-widget': 'separator' },
        speaker: { type: 'string' },
        content: { type: 'string' },
      },
    }
    const parts = transcriptParts(
      schema,
      [
        messageOf('m1', { turn: 1, round: 1, speaker: 'a', content: 'First' }),
        messageOf('m2', { turn: 2, round: 2, speaker: 'a', content: 'Second' }),
        messageOf('m3', { turn: 2, round: 3, speaker: 'a', content: 'Third' }),
      ],
      [],
    )

    expect(shapeOf(parts)).toEqual([
      { type: 'separator', fields: ['turn', 'round'] },
      { type: 'run', speaker: 'a', count: 1 },
      { type: 'separator', fields: ['turn', 'round'] },
      { type: 'run', speaker: 'a', count: 1 },
      { type: 'separator', fields: ['round'] },
      { type: 'run', speaker: 'a', count: 1 },
    ])
  })

  it('holds the messages of one speaker with no separator between them in one run', () => {
    const parts = transcriptParts(
      messageSchema,
      [
        messageOf('m1', { turn: 1, speaker: 'a', content: 'First' }),
        messageOf('m2', { turn: 1, speaker: 'a', content: 'Second' }),
      ],
      [],
    )

    expect(shapeOf(parts)).toEqual([
      { type: 'separator', fields: ['turn'] },
      { type: 'run', speaker: 'a', count: 2 },
    ])
  })

  it('gives each run the participant of its speaker, among four', () => {
    const parts = transcriptParts(
      messageSchema,
      [
        messageOf('m1', { turn: 1, speaker: 'interviewer', content: 'Who leads?' }),
        messageOf('m2', { turn: 1, speaker: 'mentor', content: 'A mentor.' }),
        messageOf('m3', { turn: 1, speaker: 'admin', content: 'An admin.' }),
        messageOf('m4', { turn: 1, speaker: 'student', content: 'A student.' }),
      ],
      fourParticipants,
    )

    expect(parts.flatMap((part) => (part.type === 'run' ? [part.participant] : []))).toEqual(
      fourParticipants,
    )
  })

  it('gives a speaker that is not a participant one of its own, at the start, neutral', () => {
    const parts = transcriptParts(
      messageSchema,
      [messageOf('m1', { turn: 1, speaker: 'stranger', content: 'A stranger.' })],
      [],
    )
    const [separator, run] = parts
    expect(separator?.type).toBe('separator')

    expect(run?.type === 'run' && run.participant).toEqual({
      key: 'stranger',
      name: 'stranger',
      itemId: null,
      side: 'start',
      tone: 'neutral',
    })
  })

  it('reads the text of each message from the title field, and the speaker from the key without the keyword', () => {
    const parts = transcriptParts(
      messageSchema,
      [messageOf('m1', { turn: 1, speaker: 'a', content: 'The words.' })],
      [],
    )
    const [, run] = parts

    expect(run?.type === 'run' && run.messages[0]?.text).toBe('The words.')

    const withoutRole = transcriptParts(
      messageSchemaWithoutRole,
      [messageOf('m1', { turn: 1, content: 'The words.' })],
      [],
    )
    const [, runWithoutRole] = withoutRole
    expect(runWithoutRole?.type === 'run' && runWithoutRole.participant.key).toBe('m1')
  })

  it('gives nothing for an interview without messages', () => {
    expect(transcriptParts(messageSchema, [], [])).toEqual([])
  })
})
