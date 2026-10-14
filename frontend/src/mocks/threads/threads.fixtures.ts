import type { Thread } from '@/features/threads'

// Mock data returned by threads.handlers.ts. Values are fixed (no random ids, no Date.now()) so
// dev mocking, unit tests, and E2E tests all see the same data.
export const mockThreads: Thread[] = [
  { id: 'thread-mock-1', title: 'Summarize the project plan', updated_at: '2026-09-30T09:15:00Z' },
  { id: 'thread-mock-2', title: 'Compare agent topologies', updated_at: '2026-09-29T16:40:00Z' },
  { id: 'thread-mock-3', title: 'Draft the evaluation rubric', updated_at: '2026-09-27T08:05:00Z' },
]
