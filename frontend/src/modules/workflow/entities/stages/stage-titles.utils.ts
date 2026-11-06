import type { VisibleStage } from './stages.types'

/** The title of each stage the user sees, by its key, parents before their children. */
export function stageTitlesOf(stages: readonly VisibleStage[]): Map<string, string> {
  const titles = new Map<string, string>()
  const add = (list: readonly VisibleStage[]) => {
    for (const stage of list) {
      titles.set(stage.key, stage.title)
      add(stage.children)
    }
  }
  add(stages)
  return titles
}
