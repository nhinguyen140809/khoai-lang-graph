/** A build, and how long it keeps what the workflow definition decides. */
export const workflowDefinitionStaleTimeCases = [
  { environment: 'production', minutes: 60, staleTime: 3_600_000 },
  { environment: 'development', minutes: 10, staleTime: 600_000 },
  { environment: 'test', minutes: 10, staleTime: 600_000 },
]
