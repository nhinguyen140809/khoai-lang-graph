import type { StageSubject } from './items.types'

/** The title of each subject of a stage, by its id. */
export function subjectTitlesOf(
  subjects: ReadonlyMap<string, StageSubject[]>,
): Map<string, string> {
  return new Map(
    [...subjects.values()].flatMap((list) => list.map((subject) => [subject.id, subject.title])),
  )
}
