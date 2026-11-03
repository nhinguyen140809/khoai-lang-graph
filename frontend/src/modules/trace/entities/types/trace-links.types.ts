import { z } from 'zod'

// Temporary hand-written schemas for the trace links API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

// A link is one relation between two items, with a type. The traceability views (see
// `traceability.types.ts`) are tables built from all the links of a project.

/** A directed link from an item to an item that it was built from, answers or concerns. */
export const traceLinkSchema = z.object({
  id: z.string(),
  source_item_id: z.string(),
  target_item_id: z.string(),
  link_type: z.string(),
  /** The version of the target when the link was made. */
  target_version: z.number().int(),
  /**
   * The words of the target that the link is about, such as the quote of an interview message; null
   * when the link is about the whole target. Named `quote` before S1b.D.
   */
  target_quote: z.string().nullable(),
  /**
   * The words of the source that the link is about, such as the part of a requirement built from
   * this target; null when the link is about the whole source.
   */
  source_quote: z.string().nullable(),
  note: z.string().nullable(),
})

export type TraceLink = z.infer<typeof traceLinkSchema>

/** What the links of a project are narrowed to; each field left out narrows nothing. */
export interface TraceLinkFilters {
  linkType?: string | undefined
  sourceItemId?: string | undefined
  targetItemId?: string | undefined
}

/** The body that makes a link by hand. */
export interface CreateTraceLinkBody {
  source_item_id: string
  target_item_id: string
  link_type: string
  note?: string | null | undefined
}
