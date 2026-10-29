// What the pages read from the checkpoints of a workflow definition, derived from it by the
// helpers in `checkpoints.utils.ts`.

/** A review the user may turn on for a run: a checkpoint of the workflow. */
export interface ReviewableCheckpoint {
  /** The id of the checkpoint node; the run configuration lists the ids that pause the run. */
  id: string
  title: string
  /** What the user is asked when the run pauses here. */
  description: string
}
