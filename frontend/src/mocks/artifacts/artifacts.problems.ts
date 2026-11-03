import { type Run, runStatusesByAttention } from '@/modules/run/entities'
import { HttpHeader } from '@/shared/api/http'

import { pendingInterruptOf } from '../interrupts/interrupts.lookup'
import { allRuns, latestRunOfEachThread } from '../runs/lookup/runs.lookup'
import { invalidState, notFound, validationFailed, versionConflict } from '../shared/http/response'

// What the handlers of the artifacts and the items refuse in a request: a record that is not there,
// a version that it never had, and a change based on another version or made outside a review.

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

// The run of the project that its status shows: the latest run of the thread that needs the user
// most, as `runStatusesByAttention` orders them.
function shownRunOf(projectId: string): Run | undefined {
  const runs = allRuns().filter((run) => run.project_id === projectId)
  return [...latestRunOfEachThread(runs).values()].sort(
    (first, second) =>
      runStatusesByAttention.indexOf(first.status) - runStatusesByAttention.indexOf(second.status),
  )[0]
}

// The version in the `If-Match` header of a request, or null when it has none.
function ifMatchVersion(request: Request): number | null {
  const header = request.headers.get(HttpHeader.IfMatch)
  if (header === null) return null
  const version = Number(header.replaceAll('"', ''))
  return Number.isInteger(version) ? version : null
}

/**
 * The answer that refuses a change of a record outside a review that allows edits: a change is
 * accepted only while the run of the project waits at a review that allows edits and lists the
 * artifact of the record. Null when the change may go on.
 */
export function refuseOutsideReview(projectId: string, artifactId: string) {
  const run = shownRunOf(projectId)
  const interrupt = run?.status === 'interrupted' ? pendingInterruptOf(run) : null
  const isListed = interrupt?.review_artifacts.some(({ artifact_id }) => artifact_id === artifactId)
  return interrupt?.allow_edits === true && isListed === true
    ? null
    : invalidState('An artifact changes only during a review that allows edits.')
}

/**
 * The answer that refuses a change of a record: one based on another version than the record has,
 * or one made outside a review that allows edits. Null when the change may go on.
 */
export function refuseChange(
  request: Request,
  record: { version: number; project_id: string },
  artifactId: string,
) {
  const based = ifMatchVersion(request)
  if (based !== record.version) {
    return versionConflict(
      `The record is at version ${String(record.version)}; the request was based on version ${String(based)}.`,
    )
  }
  return refuseOutsideReview(record.project_id, artifactId)
}
