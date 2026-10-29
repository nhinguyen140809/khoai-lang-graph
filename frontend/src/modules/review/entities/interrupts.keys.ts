/** The query keys of the interrupts of the runs, from the widest to the narrowest. */
export const interruptKeys = {
  all: () => ['interrupts'] as const,
  /** Every query of the interrupts of one run, to load them again after an answer. */
  ofRun: (runId: string) => [...interruptKeys.all(), runId] as const,
  /** Every interrupt of one run. */
  list: (runId: string) => [...interruptKeys.ofRun(runId), 'list'] as const,
  /** The interrupt that one run waits for. */
  pending: (runId: string) => [...interruptKeys.ofRun(runId), 'pending'] as const,
}
