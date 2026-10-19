/**
 * A task that runs at once when called, or once more after the run in progress when called during
 * one: every call is followed by a run that starts after it, and the calls of a burst share one
 * run. A run that fails does not stop the next.
 */
export function coalescedTask(task: () => Promise<unknown>): () => void {
  // How many times the task was called, and how many of those calls a run started after.
  let calls = 0
  let served = 0
  let running = false

  const run = async () => {
    running = true
    while (served < calls) {
      const startedAfter = calls
      await task().catch(() => undefined)
      served = startedAfter
    }
    running = false
  }

  return () => {
    calls += 1
    if (!running) void run()
  }
}
