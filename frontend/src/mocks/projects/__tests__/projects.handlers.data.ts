import type { Project } from '@/modules/project/entities'

import { IdPrefix, mockId, PROJECT_IDS } from '../../shared/mock-ids.constants'
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
    name: 'the first page of a long list in the more-loading scenario',
    address: '/?mock-projects=more-loading',
    query: '?limit=200',
    count: projectCount + bulkProjectCount,
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

/** A project in GET /projects in a scenario, and the status that the latest runs of its threads roll up to. */
export const rollupRunStatusCases = [
  {
    name: 'a project waiting for review',
    address: '/',
    projectId: PROJECT_IDS.mentor,
    status: 'interrupted',
  },
  {
    name: 'a project whose failed run a later run of its thread replaced',
    address: '/?mock-run-state=done',
    projectId: PROJECT_IDS.mentor,
    status: 'succeeded',
  },
  {
    name: 'a project whose runs ended well',
    address: '/',
    projectId: PROJECT_IDS.campus,
    status: 'succeeded',
  },
  {
    name: 'a project whose latest run failed',
    address: '/',
    projectId: mockId(IdPrefix.Project, 8),
    status: 'failed',
  },
  {
    name: 'a project without a run',
    address: '/',
    projectId: mockId(IdPrefix.Project, 12),
    status: null,
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
  {
    name: 'no field, without a name until its first message',
    body: {},
    fields: { name: null, description: null, output_language: 'en' },
  },
  {
    name: 'a blank name, as no name',
    body: { name: '   ', output_language: 'vi' },
    fields: { name: null, description: null, output_language: 'vi' },
  },
]

/** A body of POST /projects as text, and the problems of its fields. */
/** A filter of GET /projects, and what every project it answers has. */
export const projectFilterCases = [
  {
    name: 'one rollup run status',
    query: '?rollup_run_status=interrupted',
    keeps: (project: Project) => project.rollup_run_status === 'interrupted',
  },
  {
    name: 'several rollup run statuses, and none for a project without a run',
    query: '?rollup_run_status=failed&rollup_run_status=none',
    keeps: (project: Project) =>
      project.rollup_run_status === 'failed' || project.rollup_run_status === null,
  },
  {
    name: 'the activity after a time',
    query: '?last_activity_after=2026-10-06T00:00:00Z',
    keeps: (project: Project) => project.last_activity_at > '2026-10-06T00:00:00Z',
  },
]

/** A scenario of POST /projects in the page address, and what it answers. */
export const createProjectScenarioCases = [
  {
    name: 'the error scenario',
    address: '/?mock-create-project=error',
    answer: { status: 500, body: { code: 'internal_error' } },
  },
  {
    name: 'the invalid scenario',
    address: '/?mock-create-project=invalid',
    answer: {
      status: 422,
      body: { errors: [{ field: 'output_language', message: 'Choose a language.' }] },
    },
  },
]

/** A request that never answers in the scenario of the page address. */
export const pendingProjectCases = [
  {
    request: 'POST /projects in the loading scenario',
    address: '/?mock-create-project=loading',
    send: { path: '/api/v1/projects', method: 'POST' },
  },
  {
    request: 'GET /projects of a page after the first in the more-loading scenario',
    address: '/?mock-projects=more-loading',
    send: { path: '/api/v1/projects?cursor=50', method: 'GET' },
  },
  {
    request: 'DELETE /projects/{project_id} in the loading scenario',
    address: '/?mock-delete-project=loading',
    send: { path: `/api/v1/projects/${PROJECT_IDS.mentor}`, method: 'DELETE' },
  },
]

export const invalidProjectCases = [
  {
    name: 'a name that is not text',
    body: '{"name": 3}',
    errors: [{ field: 'name', message: 'Enter text, or nothing.' }],
  },
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
    method: 'GET',
    path: '/api/v1/projects',
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'GET /projects/{project_id} of a project that does not exist',
    address: '/',
    method: 'GET',
    path: '/api/v1/projects/no-such-project',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /projects/{project_id} in the empty scenario',
    address: '/?mock-project=empty',
    method: 'GET',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /projects/{project_id} in the error scenario',
    address: '/?mock-project=error',
    method: 'GET',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'PATCH /projects/{project_id} of a project that does not exist',
    address: '/',
    method: 'PATCH',
    path: '/api/v1/projects/no-such-project',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'PATCH /projects/{project_id} in the error scenario',
    address: '/?mock-update-project=error',
    method: 'PATCH',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'DELETE /projects/{project_id} of a project that does not exist',
    address: '/',
    method: 'DELETE',
    path: '/api/v1/projects/no-such-project',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'DELETE /projects/{project_id} in the error scenario',
    address: '/?mock-delete-project=error',
    method: 'DELETE',
    path: `/api/v1/projects/${PROJECT_IDS.mentor}`,
    status: 500,
    code: 'internal_error',
  },
]

/** PATCH /projects/{project_id} with a status: the project, which the list of that status then has. */
export const projectStatusChangeCases = [
  { name: 'archives an active project', projectId: PROJECT_IDS.mentor, status: 'archived' },
  { name: 'restores an archived project', projectId: PROJECT_IDS.laundry, status: 'active' },
]

/** PATCH /projects/{project_id} with a body that the API does not take, and the problems it says. */
export const invalidProjectChangeCases = [
  {
    name: 'a status that a project does not have',
    body: '{"status": "deleted"}',
    errors: [{ field: 'status', message: 'Choose active or archived.' }],
  },
  {
    name: 'a blank name',
    body: '{"name": "  "}',
    errors: [{ field: 'name', message: 'Enter a name.' }],
  },
  {
    name: 'a name that is not text',
    body: '{"name": null}',
    errors: [{ field: 'name', message: 'Enter a name.' }],
  },
]
