// What the pages read from the stages of a workflow definition, derived from it by the helpers in
// `stages.utils.ts`.

/** A stage with the stages that belong to it, for the pages that show the stages as a tree. */
export interface VisibleStage {
  key: string
  title: string
  children: VisibleStage[]
}
