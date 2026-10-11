/** The names of the commands of the console. */
export const commandNames = ['stop', 'retry', 'expand', 'collapse'] as const

export type CommandName = (typeof commandNames)[number]

const descriptions = {
  stop: 'Stop the run',
  retry: 'Run again from the failed step',
  expand: 'Show the steps of every group',
  collapse: 'Hide the steps of every group',
} as const satisfies Record<CommandName, string>

/** The commands that `/` lists in the input box, in this order. */
export const consoleCommands = commandNames.map((name) => ({
  name,
  description: descriptions[name],
}))

/** The command that the text names, or null when it names none. */
export function findCommand(text: string) {
  const name = /^\/(\S+)/.exec(text.trim())?.[1]
  return consoleCommands.find((command) => command.name === name) ?? null
}
