/** The query keys of the usage of the user, from the widest to the narrowest. */
export const usageKeys = {
  all: () => ['usage'] as const,
  /** The usage of the user in the current month. */
  month: () => [...usageKeys.all(), 'month'] as const,
}
