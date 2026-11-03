/**
 * The start of every query key of the run module: the runs, their steps, their state and their
 * directives. `runKeys.all()` covers the runs only.
 */
export const runModuleKeys = {
  all: () => ['run'] as const,
}
