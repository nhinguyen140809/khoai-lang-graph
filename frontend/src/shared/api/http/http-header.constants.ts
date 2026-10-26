/** The headers that the app reads or sets on a request or an answer. */
export const HttpHeader = {
  ContentType: 'Content-Type',
  Location: 'Location',
  IfMatch: 'If-Match',
  /** Names the file of a download. */
  ContentDisposition: 'Content-Disposition',
  /** Carries the key of a request that starts work. */
  IdempotencyKey: 'Idempotency-Key',
} as const
