/** The query keys of the account, from the widest to the narrowest; each starts with the one above. */
export const accountKeys = {
  all: () => ['account'] as const,
  me: () => [...accountKeys.all(), 'me'] as const,
}
