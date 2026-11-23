/** The text that dictation writes into, while it listens: what was written before, then what was heard, a space apart. */
export function dictatedText(base: string, heard: string): string {
  if (heard === '') return base
  if (base === '' || /\s$/.test(base)) return `${base}${heard}`
  return `${base} ${heard}`
}
