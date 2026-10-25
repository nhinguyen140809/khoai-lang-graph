/**
 * A new key for one action of the user. It is made once, before the mutation, and goes with the
 * variables of the mutation, so that a retry of the action sends the same key.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}
