/** The words of the action that opens the trace of an item. */
export const viewTraceMessages = {
  viewTrace: 'View its trace',
  /** What a tab calls the trace of an item until the page knows its own title. */
  traceTitle: (itemTitle: string) => `Trace of ${itemTitle}`,
} as const
