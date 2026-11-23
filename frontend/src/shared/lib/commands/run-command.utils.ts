import type { CommandArguments } from './command.types'
import { runnableCommand } from './command.utils'
import { useCommandRegistry } from './commands.store'

function runnable(id: string) {
  return runnableCommand(useCommandRegistry.getState().sources.values(), id)
}

/** Whether a mounted component registered a command of this id that runs. */
export function canRunCommand(id: string): boolean {
  return runnable(id) !== undefined
}

/**
 * Runs the command of this id that a mounted component registered, with these arguments. For an
 * event handler or a callback, which has no hook to read the registry with. An id that nothing
 * registers does nothing: what asked for it is on a screen that cannot do it; `canRunCommand`
 * tells.
 */
export function runCommand(id: string, args: CommandArguments = {}): void {
  runnable(id)?.run(args)
}
