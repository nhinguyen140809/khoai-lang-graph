import type { Tool } from './workflow-vocabulary.types'

/**
 * The line that stands for the uses of a tool in a row, in the words of the tool: its line for one
 * use, or its line for several with their number in place of `{count}`.
 */
export function toolUsesLine(tool: Tool, count: number): string {
  return count === 1 ? tool.uses.one : tool.uses.other.replace('{count}', String(count))
}
