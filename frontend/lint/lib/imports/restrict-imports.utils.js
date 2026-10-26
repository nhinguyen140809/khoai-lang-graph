/**
 * The no-restricted-imports rule with the paths and the patterns of a block; a key left out stays
 * out of the options. A block replaces the whole rule of the blocks before it, so each block gives
 * the full lists.
 * @param {{ paths?: object[], patterns?: object[] }} lists
 * @returns {{ 'no-restricted-imports': ['error', object] }}
 */
export function restrictImports({ paths, patterns }) {
  return {
    'no-restricted-imports': ['error', { ...(paths && { paths }), ...(patterns && { patterns }) }],
  }
}
