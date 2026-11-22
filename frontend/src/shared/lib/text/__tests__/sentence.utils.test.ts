import { createElement, Fragment, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { fillSentence, listSentenceNodes } from '../sentence.utils'

/** The markup of a list of nodes, as the page would draw them side by side. */
function markupOf(nodes: ReactNode[]) {
  return renderToStaticMarkup(createElement(Fragment, null, ...nodes))
}

const link = (name: string) => createElement('a', { href: `#${name}` }, name)

describe('fillSentence', () => {
  it('puts the part in the place that names it, between the words around it', () => {
    const nodes = fillSentence('Please read {documents} before you answer.', {
      documents: link('Plan'),
    })

    expect(markupOf(nodes)).toBe('Please read <a href="#Plan">Plan</a> before you answer.')
  })

  it('fills a place at the start or at the end of the sentence, and each place of a sentence', () => {
    expect(markupOf(fillSentence('{first} and {second}', { first: 'A', second: 'B' }))).toBe(
      'A and B',
    )
    expect(markupOf(fillSentence('Look at {thing}', { thing: 'it' }))).toBe('Look at it')
  })

  it('gives the words alone for a sentence with no place', () => {
    expect(markupOf(fillSentence('Nothing to fill.', {}))).toBe('Nothing to fill.')
  })

  it('leaves out a place that has no part', () => {
    expect(markupOf(fillSentence('Read {documents} now.', {}))).toBe('Read  now.')
  })
})

describe('listSentenceNodes', () => {
  it('draws each thing of a list with the words of the locale between them', () => {
    const nodes = listSentenceNodes(['A', 'B', 'C'], link, (name) => name)

    expect(markupOf(nodes)).toBe('<a href="#A">A</a>, <a href="#B">B</a>, and <a href="#C">C</a>')
  })

  it('draws one thing alone', () => {
    expect(markupOf(listSentenceNodes(['A'], link, (name) => name))).toBe('<a href="#A">A</a>')
  })
})
