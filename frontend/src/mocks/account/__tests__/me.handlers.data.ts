/** GET /me in the scenario of the page address: the status and the fields it answers. */
export const meCases = [
  {
    name: 'the signed-in user',
    address: '/',
    status: 200,
    body: { email: 'linh.pham@example.com', display_name: 'Linh Pham' },
  },
  {
    name: '500 in the error scenario',
    address: '/?mock-me=error',
    status: 500,
    body: { code: 'internal_error' },
  },
  {
    name: '404 in the empty scenario',
    address: '/?mock-me=empty',
    status: 404,
    body: { code: 'not_found', detail: 'The user does not exist.' },
  },
]
