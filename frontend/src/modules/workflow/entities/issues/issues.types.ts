// What the pages read from the kinds of item that record an issue, derived from the workflow
// definition by the helpers in `issues.utils.ts`.

/** A kind of item that records a problem to settle, and where its content says if it is open. */
export interface IssueKind {
  kind: string
  /** The field of the content that holds the status of the issue. */
  statusField: string
  /** The values of that field while the issue is still open. */
  openValues: string[]
}
