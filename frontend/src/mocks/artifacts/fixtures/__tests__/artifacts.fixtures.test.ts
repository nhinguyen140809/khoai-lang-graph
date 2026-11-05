import { describe, expect, it } from 'vitest'

import { projectIds } from '../../../shared/db'
import { findKind } from '../../../workflow/artifact-kinds.fixtures'
import { artifactFixtures, itemFixtures } from '../artifacts.fixtures'

describe('the artifact fixtures', () => {
  it('follow the schema version that the definition gives their kind', () => {
    const behind = [...artifactFixtures, ...itemFixtures]
      .filter(({ kind, schema_version }) => findKind(kind)?.schema_version !== schema_version)
      .map(({ kind }) => kind)

    expect(behind).toEqual([])
  })

  it('give each participant of an interview the id of the item it is; the interviewer has none', () => {
    const interviews = artifactFixtures.filter(({ kind }) => kind === 'interview_transcript')
    expect(interviews.length).toBe(4)

    for (const interview of interviews) {
      const participants = interview.content.participants
      expect(Array.isArray(participants)).toBe(true)
      const entries = (Array.isArray(participants) ? participants : []) as {
        key: string
        item_id: string | null
      }[]
      expect(entries[0]?.key).toBe('interviewer')
      expect(entries[0]?.item_id).toBeNull()
      const persona = entries[1]
      const item = itemFixtures.find(
        (candidate) =>
          candidate.project_id === interview.project_id && candidate.key === persona?.key,
      )
      expect(persona?.item_id).toBe(item?.id ?? null)
    }
  })

  it('hold one interview in progress in the library project', () => {
    const library = artifactFixtures.filter(({ project_id }) => project_id === projectIds.library)

    expect(library.map(({ kind }) => kind)).toEqual([
      'elicitation_plan',
      'persona_catalog',
      'requirement_specification',
      'interview_transcript',
    ])
  })
})
