'use client'

import type { ComponentType } from 'react'

import type { ReaderBodyProps, ReaderView } from '../reader.types'
import { DocumentBody } from './DocumentBody'
import { DocumentListBody } from './DocumentListBody'
import { ItemBody } from './ItemBody'

/** The body that draws each kind of view; a new kind of view needs its body here, or the types fail. */
const readerBodies = {
  documents: DocumentListBody,
  document: DocumentBody,
  item: ItemBody,
} satisfies { [Kind in ReaderView['kind']]: ComponentType<ReaderBodyProps<Kind>> }

/**
 * What the reader shows, read-only, in an area that scrolls on its own: the list of the documents
 * of the project, each a link that opens it in the reader, a document, whose items open in its
 * place, or an item. The body of the kind of the view draws it.
 */
export function ReaderContent(props: ReaderBodyProps<ReaderView['kind']>) {
  // The body is picked by the kind of the view, so the view it is given is always its own kind.
  const Body = readerBodies[props.view.kind] as ComponentType<ReaderBodyProps<ReaderView['kind']>>
  return <Body {...props} />
}
