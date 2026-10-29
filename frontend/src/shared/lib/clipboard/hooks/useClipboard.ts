import { useEffect, useRef, useState } from 'react'

// How long what was copied holds, before the state goes back to copying.
const COPIED_MS = 2000

/**
 * Copies a text to the clipboard of the browser. While what was copied holds, `isCopied` is
 * true, and two seconds later it goes back to false; a copy while it holds starts the two
 * seconds again. A clipboard that refuses leaves the state as it was.
 */
export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [])

  const copy = (value: string) => {
    if (timer.current !== null) clearTimeout(timer.current)
    void navigator.clipboard.writeText(value).then(
      () => {
        setIsCopied(true)
        timer.current = setTimeout(() => {
          setIsCopied(false)
        }, COPIED_MS)
      },
      () => {
        // A copy that fails while one before it holds says copied no longer.
        setIsCopied(false)
      },
    )
  }

  return { isCopied, copy }
}
