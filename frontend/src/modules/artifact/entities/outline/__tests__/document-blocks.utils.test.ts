import { describe, expect, it } from 'vitest'

import { documentBlocks, hasTranscript } from '../document-blocks.utils'
import { kindViewFixtures, mentorDocument } from './outline.utils.data'

describe('documentBlocks', () => {
  it('gives a heading for each section, at a level that follows its depth', () => {
    const blocks = documentBlocks(
      { ...mentorDocument('requirement_specification'), kinds: kindViewFixtures },
      { artifactDisplay: 'document' },
    )
    const headings = blocks.flatMap((block) =>
      block.type === 'heading' ? [`${String(block.level)} ${block.title}`] : [],
    )

    expect(headings).toEqual([
      '2 Introduction',
      '2 Overall description',
      '2 Functional requirements',
      '3 Mentor discovery',
      '3 Booking',
      '3 Mentor profile',
      '2 Non-functional requirements',
    ])
  })

  it('draws a run of items of one kind with the display of the kind', () => {
    const blocks = documentBlocks(
      { ...mentorDocument('requirement_specification'), kinds: kindViewFixtures },
      { artifactDisplay: 'document' },
    )
    const runs = blocks.flatMap((block) =>
      block.type === 'items' ? [`${block.display}:${String(block.items.length)}`] : [],
    )

    expect(runs).toEqual(['table:2', 'table:3', 'table:2', 'table:3'])
  })

  it('gives a heading with the count for each group of a document without sections', () => {
    const blocks = documentBlocks(
      { ...mentorDocument('requirements_analysis'), kinds: kindViewFixtures },
      { artifactDisplay: 'document' },
    )

    expect(blocks.slice(0, 2)).toMatchObject([
      { type: 'group', title: 'Stated need', count: 8 },
      { type: 'items', display: 'table' },
    ])
  })

  it('draws avatar cards and transcripts with their own display', () => {
    const persona = documentBlocks(
      { ...mentorDocument('persona_catalog'), kinds: kindViewFixtures },
      { artifactDisplay: 'document' },
    )
    const transcript = documentBlocks(
      { ...mentorDocument('interview_transcript'), kinds: kindViewFixtures },
      { artifactDisplay: 'transcript' },
    )

    expect(persona.at(-1)).toMatchObject({ type: 'items', display: 'profile' })
    expect(transcript.at(-1)).toMatchObject({ type: 'items', display: 'transcript' })
  })

  it('gives a transcript no heading for the group of its messages', () => {
    const blocks = documentBlocks(
      { ...mentorDocument('interview_transcript'), kinds: kindViewFixtures },
      { artifactDisplay: 'transcript' },
    )

    expect(blocks.some((block) => block.type === 'group')).toBe(false)
  })

  it('gives nothing for a document without items', () => {
    expect(
      documentBlocks(
        { ...mentorDocument('elicitation_plan'), kinds: kindViewFixtures },
        { artifactDisplay: 'document' },
      ),
    ).toEqual([])
  })
})

describe('hasTranscript', () => {
  it('tells whether the blocks of a document draw messages of a transcript', () => {
    expect(
      hasTranscript(
        documentBlocks(
          { ...mentorDocument('interview_transcript'), kinds: kindViewFixtures },
          { artifactDisplay: 'transcript' },
        ),
      ),
    ).toBe(true)
    expect(
      hasTranscript(
        documentBlocks(
          { ...mentorDocument('requirement_specification'), kinds: kindViewFixtures },
          { artifactDisplay: 'document' },
        ),
      ),
    ).toBe(false)
  })
})
