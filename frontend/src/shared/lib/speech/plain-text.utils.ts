/**
 * The words of a markdown text without its marks, for a voice to read: the text of a link without
 * its address, no code fences, no marks of headings, lists, quotes or emphasis.
 */
export function plainTextOf(markdown: string): string {
  return (
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
      // Marks of emphasis and code go. An underscore goes only where it opens or closes a word, as
      // `_this_` does: inside a word, as in `item_kind`, it belongs to the name and is read.
      .replace(/[*`~]+/g, '')
      .replace(/(^|[^\w])_{1,3}(?=\S)/g, '$1')
      .replace(/(?<=\S)_{1,3}(?=[^\w]|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
}
