/** The query keys of the user, from the widest to the narrowest; each starts with the one above. */
export const userKeys = {
  all: () => ['user'] as const,
  me: () => [...userKeys.all(), 'me'] as const,
}
