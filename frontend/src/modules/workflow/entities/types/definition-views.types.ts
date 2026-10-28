// What the pages read from a workflow definition, derived from it by the helpers in
// `workflow-definition.utils.ts`.

/** A stage with the stages that belong to it, for the pages that show the stages as a tree. */
export interface VisibleStage {
  key: string
  title: string
  children: VisibleStage[]
}

/** A review the user may turn on for a run: a checkpoint of the workflow. */
export interface ReviewableCheckpoint {
  /** The id of the checkpoint node; the run configuration lists the ids that pause the run. */
  id: string
  title: string
  /** What the user is asked when the run pauses here. */
  description: string
}

/** A kind of item that records a problem to settle, and where its content says if it is open. */
export interface IssueKind {
  kind: string
  /** The field of the content that holds the status of the issue. */
  statusField: string
  /** The values of that field while the issue is still open. */
  openValues: string[]
}
