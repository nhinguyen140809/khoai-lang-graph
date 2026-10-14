import { PROJECT_IDS } from '../../shared/mock-ids.constants'
import { bulkProjectCount, extraProjectSpecs } from '../extra-project-specs.constants'
import { mockProjects } from '../projects.fixtures'

const projectCount = mockProjects.length + extraProjectSpecs.length

/** GET /projects in the scenario of the page address, with a query: the page it answers. */
export const projectListCases = [
  { name: 'every project', address: '/', query: '', count: projectCount, nextCursor: null },
  { name: 'the first page', address: '/', query: '?limit=5', count: 5, nextCursor: '5' },
  {
    name: 'the last page',
    address: '/',
    query: `?limit=5&cursor=${String(projectCount - 2)}`,
    count: 2,
    nextCursor: null,
  },
  {
    name: 'a long list in the many scenario',
    address: '/?mock-projects=many',
    query: '?limit=200',
    count: projectCount + bulkProjectCount,
    nextCursor: null,
  },
  {
    name: 'no project in the empty scenario',
    address: '/?mock-projects=empty',
    query: '',
    count: 0,
    nextCursor: null,
  },
]

/** A project in GET /projects, and the unfinished runs it counts. */
export const unfinishedRunCountCases = [
  {
    name: 'a project waiting for review',
    address: '/',
    projectId: PROJECT_IDS.mentor,
    counts: { queued: 0, running: 0, interrupted: 1 },
  },
  {
    name: 'a project with a running run',
    address: '/',
    projectId: PROJECT_IDS.library,
    counts: { queued: 0, running: 1, interrupted: 0 },
  },
  {
    name: 'a project whose runs ended',
    address: '/',
    projectId: PROJECT_IDS.campus,
    counts: { queued: 0, running: 0, interrupted: 0 },
  },
  {
    name: 'a project whose run the scenario sets running',
    address: '/?mock-run-state=running',
    projectId: PROJECT_IDS.mentor,
    counts: { queued: 0, running: 1, interrupted: 0 },
  },
]

/** A body of POST /projects, and the fields of the project it creates. */
export const createProjectCases = [
  {
    name: 'every field',
    body: { name: '  Clinic booking  ', description: 'Book a doctor.', output_language: 'vi' },
    fields: { name: 'Clinic booking', description: 'Book a doctor.', output_language: 'vi' },
  },
  {
    name: 'a name only, in English and without a description',
    body: { name: 'Clinic booking' },
    fields: { name: 'Clinic booking', description: null, output_language: 'en' },
  },
]

const enterName = { field: 'name', message: 'Enter a name.' }

/** A body of POST /projects as text, and the problems of its fields. */
export const invalidProjectCases = [
  { name: 'no field', body: '{}', errors: [enterName] },
  { name: 'a blank name', body: '{"name": "   "}', errors: [enterName] },
  { name: 'a name that is not text', body: '{"name": 3}', errors: [enterName] },
  { name: 'a body of null', body: 'null', errors: [enterName] },
  { name: 'a body that is not JSON', body: 'not json', errors: [enterName] },
  {
    name: 'a description that is not text and a language it does not have',
    body: '{"name": "Clinic booking", "description": 42, "output_language": "fr"}',
    errors: [
      { field: 'description', message: 'Enter text, or nothing.' },
      { field: 'output_language', message: 'Choose a language.' },
    ],
  },
]

/** A request in the scenario of the page address, and the error it answers. */
export const projectErrorCases = [
  {
    request: 'GET /projects in the error scenario',
    address: '/?mock-projects=error',
    path: '/api/v1/projects',
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'GET /projects/{project_id} of a project that does not exist',
    address: '/',
    path: '/api/v1/projects/no-such-project',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /projects/{project_id} in the empty scenario',
    address: '/?mock-project=empty',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /projects/{project_id} in the error scenario',
    address: '/?mock-project=error',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 500,
    code: 'internal_error',
  },
]
