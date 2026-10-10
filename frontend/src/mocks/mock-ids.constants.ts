// Fixed ids of the mock data, shared by the fixture files. Each id starts like the id of the same
// record in the API examples, so that the examples and the mock data are easy to match.

function id(prefix: string, n: number): string {
  return `${prefix}0000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

export const USER_ID = id('11b7', 1)

export const PROJECT_IDS = {
  mentor: id('90aa', 1),
  campus: id('90aa', 2),
  library: id('90aa', 3),
  laundry: id('90aa', 4),
}

export const THREAD_IDS = {
  mentorMain: id('7f3a', 1),
  campusMain: id('7f3a', 3),
  libraryMain: id('7f3a', 4),
  laundryMain: id('7f3a', 5),
}

export const RUN_IDS = {
  /** Run 1 of the mentor thread: its first message started it, and it went through the whole workflow. */
  mentorMain1: id('3b90', 1),
  /** Run 2 of the mentor thread: it failed at its cost limit. */
  mentorMain2: id('4c18', 1),
  /** Run 3 of the mentor thread, the run of the API examples: it retries run 2 and waits at the analysis review. */
  mentorMain3: id('5f2d', 1),
  campusMain1: id('7e10', 2),
  libraryMain1: id('7e10', 3),
  laundryMain1: id('7e10', 4),
}

export function itemId(n: number): string {
  return id('c41e', n)
}

export const PERSONA_IDS = [id('8c20', 1), id('8c20', 2), id('8c20', 3)] as const

export function stepId(runIndex: number, sequence: number): string {
  return id('e1a0', runIndex * 1000 + sequence)
}

/** Ids of records created while the mock server runs, apart from the ids of the fixtures. */
export function createdId(prefix: string, n: number): string {
  return id(prefix, 9000 + n)
}
