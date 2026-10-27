import { projectIds } from '../../../src/mocks/shared/db/mock-ids.constants'

/** A project opened from the list: the address of the list, the status of the project there, and its id. */
export const openedProjectCases = [
  { name: 'Mentor platform', from: '/', status: 'Waiting for you', id: projectIds.mentor },
  { name: 'Campus food ordering', from: '/projects', status: 'Done', id: projectIds.campus },
]

/** A project created from an idea, the name typed in the dialog, and the name it gets. */
export const createdProjectCases = [
  {
    name: 'names a project from its idea when the name is left empty',
    idea: 'Thesis tracker\nFor the supervisors of a faculty.',
    typedName: '',
    shownName: 'Thesis tracker',
  },
  {
    name: 'names a project as typed',
    idea: 'A board where the supervisors of a faculty follow their theses.',
    typedName: 'Supervision board',
    shownName: 'Supervision board',
  },
]

/** A list of projects, a project that it shows, and one that it leaves out. */
export const listCases = [
  {
    name: 'lists the active projects',
    archived: false,
    shows: 'Mentor platform',
    hides: 'Dorm laundry booking',
  },
  {
    name: 'lists the archived projects',
    archived: true,
    shows: 'Dorm laundry booking',
    hides: 'Mentor platform',
  },
]

/** The address of a project that is not found. */
export const notFoundCases = [
  { name: 'a project that does not exist', address: '/projects/missing/activity' },
  {
    name: 'a project that the API does not find',
    address: `/projects/${projectIds.mentor}/activity?mock-project=empty`,
  },
]
