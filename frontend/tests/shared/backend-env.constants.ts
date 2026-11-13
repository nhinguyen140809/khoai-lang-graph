import path from 'node:path'

/** The ports of the two servers that these tests start, apart from the ones a developer uses. */
export const frontendPort = 3100
export const backendPort = 8011

/** The app, which proxies `/api` to the backend: the tests reach everything through it. */
export const frontendUrl = `http://localhost:${String(frontendPort)}`
export const backendUrl = `http://localhost:${String(backendPort)}`

/** Where the sign-in of `globalSetup` keeps its cookies, for the page and the requests of every test. */
export const storageStatePath = path.join(import.meta.dirname, '../.auth/linh.json')

/** The database of the backend of these tests: made again at each start, from the demo seed. */
export const databaseFile = path.join(import.meta.dirname, '../../../backend/data/e2e.db')

/** The account that the demo seed creates. */
export const seededAccount = { email: 'linh.pham@example.com', password: 'secret' }

/** The projects that the demo seed creates, by the name the project list shows. */
export const seededProjects = {
  mentor: { id: '90aa0000-0000-4000-8000-000000000001', name: 'Mentor platform', status: 'Done' },
  campus: {
    id: '90aa0000-0000-4000-8000-000000000002',
    name: 'Campus food ordering',
    status: 'Not started',
  },
} as const
