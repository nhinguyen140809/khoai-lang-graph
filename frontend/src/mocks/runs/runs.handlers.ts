import { http, HttpResponse } from 'msw'

// Fake backend for local development (NEXT_PUBLIC_API_MOCKING=enabled), unit tests, and E2E tests.
// Shapes follow docs/PLANNING.md section 6 and must be kept in sync with src/features/chat/chat.types.ts.

export const MOCK_RUN_ID = 'run-mock-1'

export const handlers = [
  http.post('/api/v1/threads/:threadId/runs', () => HttpResponse.json({ run_id: MOCK_RUN_ID })),
]
