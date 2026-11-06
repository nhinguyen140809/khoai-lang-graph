/** A function that waits for a pause in its calls before it runs. */
interface Debounced<A extends unknown[]> {
  (...args: A): void
  /** Drops the call that waits. */
  cancel: () => void
  /** Runs the call that waits at once; nothing happens when none waits. */
  flush: () => void
}

/**
 * Runs `run` with the arguments of the last call once `wait` milliseconds have passed without
 * another call.
 */
export function debounce<A extends unknown[]>(
  run: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let waiting: A | undefined

  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    waiting = undefined
  }
  const flush = () => {
    const args = waiting
    cancel()
    if (args !== undefined) run(...args)
  }
  const debounced = (...args: A) => {
    if (timer !== undefined) clearTimeout(timer)
    waiting = args
    timer = setTimeout(flush, wait)
  }
  return Object.assign(debounced, { cancel, flush })
}
