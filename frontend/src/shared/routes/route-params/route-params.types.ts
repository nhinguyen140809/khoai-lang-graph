/**
 * The query parameters of the pages. The functions of the routes write them and the pages read
 * them, so that both use the same names.
 */
export const RouteParam = {
  /** The page to return to after logging in, on the login and account pages. */
  Next: 'next',
  /** The item that a document page scrolls to and marks, or that the reader beside a chat shows. */
  Item: 'item',
  /** The document, by the id of its artifact, that the reader beside a chat shows. */
  Document: 'document',
  /** What else the reader beside a chat shows, such as `documents`, the list of the documents. */
  Reader: 'reader',
  /** The entry of the chat of the activity that the page scrolls to and marks. */
  Entry: 'entry',
} as const

/** The name of a query parameter of a page, as `RouteParam` lists them. */
export type RouteParamName = (typeof RouteParam)[keyof typeof RouteParam]
