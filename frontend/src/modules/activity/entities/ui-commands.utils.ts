import type { UiCommand } from '@/modules/thread/entities/@x/activity'
import { runCommand } from '@/shared/lib/commands'

/**
 * Runs what an answer asks, in the order it asks it, each as the command of its id that a mounted
 * component registered; one that nothing registers does nothing, since the answer has been said
 * either way. `threadId` is the thread that the message was sent to, for a command that acts on it.
 */
export function runUiCommands(commands: readonly UiCommand[], threadId: string): void {
  for (const { command, artifact_id: artifactId, item_id: itemId, label } of commands) {
    runCommand(command, { artifact_id: artifactId, item_id: itemId, label, thread_id: threadId })
  }
}
