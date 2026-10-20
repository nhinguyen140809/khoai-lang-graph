// Fixed ids of the mock data, shared by the fixture files. Each id starts like the id of the same
// record in the API examples, so that the examples and the mock data are easy to match.

/** An id of the mock data: the prefix of its kind and a number. */
export function mockId(prefix: string, n: number): string {
  return `${prefix}0000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

/** The prefix of the ids of each kind of record, as in the API examples. */
export const IdPrefix = {
  User: '11b7',
  Project: '90aa',
  Thread: '7f3a',
  Run: '5f2d',
  Message: 'c2a1',
  Persona: '8c20',
  Step: 'e1a0',
} as const

const id = mockId

export const userId = id(IdPrefix.User, 1)

export const projectIds = {
  mentor: id(IdPrefix.Project, 1),
  campus: id(IdPrefix.Project, 2),
  library: id(IdPrefix.Project, 3),
  laundry: id(IdPrefix.Project, 4),
}

/** The main thread of a project has the number of its project. */
export const threadIds = {
  mentorMain: id(IdPrefix.Thread, 1),
  campusMain: id(IdPrefix.Thread, 2),
  libraryMain: id(IdPrefix.Thread, 3),
  laundryMain: id(IdPrefix.Thread, 4),
}

export const runIds = {
  /** Run 1 of the mentor thread: its first message started it, and it went through the whole workflow. */
  mentorMain1: id('3b90', 1),
  /** Run 2 of the mentor thread: it failed at its cost limit. */
  mentorMain2: id('4c18', 1),
  /** Run 3 of the mentor thread, the run of the API examples: it retries run 2 and waits at the analysis review. */
  mentorMain3: id(IdPrefix.Run, 1),
  campusMain1: id('7e10', 2),
  libraryMain1: id('7e10', 3),
  laundryMain1: id('7e10', 4),
}

export const personaIds = [
  id(IdPrefix.Persona, 1),
  id(IdPrefix.Persona, 2),
  id(IdPrefix.Persona, 3),
] as const

export function stepId(runIndex: number, sequence: number): string {
  return id(IdPrefix.Step, runIndex * 1000 + sequence)
}

/** Ids of records created while the mock server runs, apart from the ids of the fixtures. */
export function createdId(prefix: string, n: number): string {
  return id(prefix, 9000 + n)
}
