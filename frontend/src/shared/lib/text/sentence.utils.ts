import { createElement, Fragment, type ReactNode } from 'react'

import { listSentenceParts } from './list.utils'

// A place in a sentence for a part that is not text: the name of the part between braces.
const placePattern = /\{(\w+)\}/g

/**
 * A sentence of the app with places for the parts that are not text, such as links, filled in:
 * `fillSentence('Please read {documents} before you answer.', { documents: links })`. The words stay
 * in one string, so that a sentence is read, and translated, as a whole instead of as the pieces
 * that surround its parts. A place with no part given is left out.
 */
export function fillSentence(
  template: string,
  parts: Readonly<Record<string, ReactNode>>,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let from = 0
  for (const match of template.matchAll(placePattern)) {
    const before = template.slice(from, match.index)
    if (before !== '') nodes.push(createElement(Fragment, { key: `text-${String(from)}` }, before))
    nodes.push(
      createElement(Fragment, { key: `part-${String(match.index)}` }, parts[match[1] ?? '']),
    )
    from = match.index + match[0].length
  }
  const rest = template.slice(from)
  if (rest !== '') nodes.push(createElement(Fragment, { key: `text-${String(from)}` }, rest))
  return nodes
}

/**
 * A list of things written as a sentence of the locale ("A, B, and C"), each thing drawn by
 * `render`: the separators are text and the things are nodes, so that each can be a link.
 */
export function listSentenceNodes<T>(
  items: readonly T[],
  render: (item: T) => ReactNode,
  keyOf: (item: T) => string,
): ReactNode[] {
  return listSentenceParts(items).map((part, index) =>
    part.type === 'text'
      ? createElement(Fragment, { key: `text-${String(index)}` }, part.text)
      : createElement(Fragment, { key: keyOf(part.value) }, render(part.value)),
  )
}
