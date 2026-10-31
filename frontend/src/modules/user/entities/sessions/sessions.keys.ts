/** The query keys of the sessions of the user, from the widest to the narrowest. */
export const sessionKeys = {
  all: () => ['sessions'] as const,
  /** Every session of the user that is not revoked. */
  list: () => [...sessionKeys.all(), 'list'] as const,
}
