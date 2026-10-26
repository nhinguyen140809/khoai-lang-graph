/** Waits `ms` milliseconds, for a step that takes a moment, such as a demo of a pending action. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
