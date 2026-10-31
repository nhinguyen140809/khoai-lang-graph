import { mockState } from '../shared/db'

// The sessions revoked since the fixtures: the id of each, with its `revoked_at`.
export const revokedSessions = mockState<Record<string, string>>('revoked-sessions', () => ({}))
