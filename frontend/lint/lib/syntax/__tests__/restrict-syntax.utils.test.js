import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'

import { restrictSyntax } from '../restrict-syntax.utils.js'

/**
 * @param {string} code
 * @param {Parameters<typeof restrictSyntax>} groups
 */
function messagesOf(code, ...groups) {
  const linter = new Linter()
  const config = [{ languageOptions: { sourceType: 'module' }, rules: restrictSyntax(...groups) }]
  return linter.verify(code, config).map((problem) => problem.message)
}

describe('restrictSyntax', () => {
  it('reports a default export', () => {
    expect(messagesOf('export default 1', 'defaultExport')).toEqual([
      'Use a named export; only the routing files of Next.js export a default.',
    ])
  })

  it('reports a path of the API written out, in a string and in a template', () => {
    expect(messagesOf("fetch('/api/v1/projects')", 'apiPaths')).toHaveLength(1)
    expect(messagesOf('fetch(`/api/v1/${id}`)', 'apiPaths')).toHaveLength(1)
    expect(messagesOf("fetch('/other')", 'apiPaths')).toHaveLength(0)
  })

  it('reports a status and a header of HTTP written out', () => {
    expect(messagesOf('const a = { status: 404 }', 'httpVocabulary')).toHaveLength(1)
    expect(messagesOf("headers.get('Content-Type')", 'httpVocabulary')).toHaveLength(1)
  })

  it('reports a query key written inline', () => {
    expect(messagesOf("useQuery({ queryKey: ['a'] })", 'inlineKeys')).toHaveLength(1)
  })

  it('reports a function in a constants file', () => {
    expect(messagesOf('export const f = () => 1', 'valuesInConstants')).toHaveLength(1)
    expect(messagesOf("export const WORDS = { a: 'b' }", 'valuesInConstants')).toHaveLength(0)
  })

  it('reports a group it does not have', () => {
    expect(() => restrictSyntax(/** @type {never} */ ('persistStorge'))).toThrow(
      'Unknown group of syntax: persistStorge.',
    )
  })
})
