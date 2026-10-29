import { HttpHeader } from '@/shared/api/http'

import { allRuns } from '../runs/lookup/runs.lookup'
import { invalidState, notFound, validationFailed, versionConflict } from '../shared/http/response'

// What the handlers of the artifacts and the items refuse in a request: a record that is not there,
// a version that it never had, and a change based on another version or made while a run is
// running.

/** The answer to a request that names an artifact the mock server does not hold. */
export function artifactNotFound() {
  return notFound('The artifact')
}

/** The answer to a request that names an item the mock server does not hold. */
export function itemNotFound() {
  return notFound('The item')
}

/** The answer to a read of a record at a version that it never had. */
export function versionNotFound() {
  return notFound('The version')
}

/** The answer to a restore that names a version the record never had. */
export function invalidRestoreVersion() {
  return validationFailed([{ field: 'version', message: 'No such version.' }])
}

function hasRunningRun(projectId: string): boolean {
  return allRuns().some((run) => run.project_id === projectId && run.status === 'running')
}

// The version in the `If-Match` header of a request, or null when it has none.
function ifMatchVersion(request: Request): number | null {
  const header = request.headers.get(HttpHeader.IfMatch)
  if (header === null) return null
  const version = Number(header.replaceAll('"', ''))
  return Number.isInteger(version) ? version : null
}

/** The answer that refuses a change while a run of the project is running; null otherwise. */
export function refuseWhileRunning(projectId: string) {
  return hasRunningRun(projectId)
    ? invalidState('The artifacts and the items are read-only while a run is running.')
    : null
}

/**
 * The answer that refuses a change of a record: one based on another version than the record has,
 * or one made while a run is running. Null when the change may go on.
 */
export function refuseChange(request: Request, record: { version: number; project_id: string }) {
  const based = ifMatchVersion(request)
  if (based !== record.version) {
    return versionConflict(
      `The record is at version ${String(record.version)}; the request was based on version ${String(based)}.`,
    )
  }
  return refuseWhileRunning(record.project_id)
}
