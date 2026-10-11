import { consoleCommands } from './commands.constants'

/** The command being typed: `/st` lists `stop`. Null when the text is not a command in progress. */
export function commandPrefix(value: string): string | null {
  const match = /^\/([a-z-]*)$/.exec(value)
  return match?.[1] ?? null
}

/** The commands whose name starts with what was typed after the slash. */
export function matchingCommands(prefix: string) {
  return consoleCommands.filter(({ name }) => name.startsWith(prefix))
}

export interface MentionToken {
  /** What was typed after the `@`. */
  query: string
  /** Where the `@` is in the text. */
  start: number
}

/** The `@` word that ends at the cursor, or null when the cursor is not at one. */
export function mentionAtCursor(value: string, cursor: number): MentionToken | null {
  const before = value.slice(0, cursor)
  const match = /(?:^|\s)@([^\s@]*)$/.exec(before)
  const query = match?.[1]
  if (query === undefined) return null
  return { query, start: cursor - query.length - 1 }
}

/** Replaces the `@` word with the key, followed by a space, and puts the cursor after it. */
export function insertMention(value: string, token: MentionToken, cursor: number, key: string) {
  const rest = value.slice(cursor)
  const space = /^\s/.test(rest) ? '' : ' '
  const text = `${value.slice(0, token.start)}@${key}${space}${rest}`
  return { text, cursor: token.start + key.length + 2 }
}

// Fields that can name an item, in order of preference.
const nameFields = ['title', 'name', 'statement'] as const

/** What an item is called: its title or name, else nothing. */
export function itemLabel(content: Record<string, unknown>): string {
  for (const field of nameFields) {
    const value = content[field]
    if (typeof value === 'string' && value !== '') return value
  }
  return ''
}
