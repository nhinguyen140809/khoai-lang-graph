'use client'

import { useCallback, useSyncExternalStore } from 'react'

import type { LiveFile } from '../live-file.types'
import { fileOfSource, subscribeToSource } from '../live-file.utils'

const none = () => null

/**
 * The file that a source at an address last sent (a tool that builds a file as its author saves it),
 * which changes each time it builds a new one; none while there is no address, or before the first
 * file arrives. Every part of the page that asks for an address shares one connection.
 */
export function useLiveFile(url: string | undefined): LiveFile | null {
  const subscribe = useCallback(
    (listener: () => void) =>
      url === undefined ? () => undefined : subscribeToSource(url, listener),
    [url],
  )
  const read = useCallback(() => (url === undefined ? null : fileOfSource(url)), [url])
  return useSyncExternalStore(subscribe, read, none)
}
