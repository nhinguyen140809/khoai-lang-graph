/** What validateNewThread reads from a body: the title it answers. */
export const newThreadCases = [
  { name: 'an empty body', body: {}, title: null },
  { name: 'a null title', body: { title: null }, title: null },
  { name: 'a title with space around it', body: { title: ' Interviews ' }, title: 'Interviews' },
]

/** What validateNewThread refuses: the field of its problem. */
export const newThreadProblemCases = [
  { name: 'a blank title', body: { title: '  ' }, field: 'title' },
  { name: 'a title that is not text', body: { title: 3 }, field: 'title' },
]

/** What validateThreadChange reads from a body: the change it answers. */
export const threadChangeCases = [
  { name: 'an empty body', body: {}, change: {} },
  {
    name: 'a title with space around it',
    body: { title: ' Renamed ' },
    change: { title: 'Renamed' },
  },
  { name: 'a status', body: { status: 'archived' }, change: { status: 'archived' } },
  {
    name: 'a title and a status',
    body: { title: 'Renamed', status: 'active' },
    change: { title: 'Renamed', status: 'active' },
  },
]

/** What validateThreadChange refuses: the field of its problem. */
export const threadChangeProblemCases = [
  { name: 'a null title', body: { title: null }, field: 'title' },
  { name: 'a blank title', body: { title: ' ' }, field: 'title' },
  { name: 'an unknown status', body: { status: 'closed' }, field: 'status' },
]
