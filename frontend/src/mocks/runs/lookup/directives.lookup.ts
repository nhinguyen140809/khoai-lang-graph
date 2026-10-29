import type { Directive } from '@/modules/run/entities'

import { directiveFixtures } from '../fixtures/directives.fixtures'

/** The directives of a run, by the loop they start. */
export function directivesOfRun(runId: string): Directive[] {
  return directiveFixtures
    .filter((directive) => directive.run_id === runId)
    .toSorted((a, b) => a.iteration - b.iteration)
}
