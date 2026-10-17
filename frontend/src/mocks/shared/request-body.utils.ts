/**
 * The fields of a JSON body sent to the mock server. A body that is not a JSON object reads as no
 * field, so that each handler answers the fields it misses.
 */
export async function readBodyFields(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json().catch(() => null)
  return typeof body === 'object' && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
}
