/** The start of every query key of the trace module, to load all of it again after a change. */
export const traceModuleKeys = {
  all: () => ['trace'] as const,
}
