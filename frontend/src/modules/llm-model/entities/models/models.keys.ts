/** The query keys of the model catalog, from the widest to the narrowest; each starts with the one above. */
export const modelKeys = {
  all: () => ['models'] as const,
  /** The whole catalog. */
  list: () => [...modelKeys.all(), 'list'] as const,
}
