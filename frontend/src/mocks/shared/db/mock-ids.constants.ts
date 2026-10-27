import { mockId } from './mock-ids.utils'

// Fixed ids of the mock data, shared by the fixture files. Each id starts like the id of the same
// record in the API examples, so that the examples and the mock data are easy to match.

/** The prefix of the ids of each kind of record, as in the API examples. */
export const IdPrefix = {
  User: '11b7',
  Project: '90aa',
  Thread: '7f3a',
  Run: '5f2d',
  Message: 'c2a1',
  Persona: '8c20',
  Step: 'e1a0',
  Artifact: 'a7f3',
  Item: 'c41e',
} as const

export const userId = mockId(IdPrefix.User, 1)

export const projectIds = {
  mentor: mockId(IdPrefix.Project, 1),
  campus: mockId(IdPrefix.Project, 2),
  library: mockId(IdPrefix.Project, 3),
  laundry: mockId(IdPrefix.Project, 4),
}

/** The main thread of a project has the number of its project. */
export const threadIds = {
  mentorMain: mockId(IdPrefix.Thread, 1),
  campusMain: mockId(IdPrefix.Thread, 2),
  libraryMain: mockId(IdPrefix.Thread, 3),
  laundryMain: mockId(IdPrefix.Thread, 4),
}

export const runIds = {
  /** Run 1 of the mentor thread: its first message started it, and it went through the whole workflow. */
  mentorMain1: mockId('3b90', 1),
  /** Run 2 of the mentor thread: it failed at its cost limit. */
  mentorMain2: mockId('4c18', 1),
  /** Run 3 of the mentor thread, the run of the API examples: it retries run 2 and waits at the analysis review. */
  mentorMain3: mockId(IdPrefix.Run, 1),
  campusMain1: mockId('7e10', 2),
  libraryMain1: mockId('7e10', 3),
  laundryMain1: mockId('7e10', 4),
}

export const personaIds = [
  mockId(IdPrefix.Persona, 1),
  mockId(IdPrefix.Persona, 2),
  mockId(IdPrefix.Persona, 3),
] as const
