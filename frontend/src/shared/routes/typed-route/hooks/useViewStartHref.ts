'use client'

import { useSyncExternalStore } from 'react'

import type { View } from '@/shared/lib/view'

import { viewStartHref } from '../view-start.utils'

const neverChanges = () => () => undefined
const hostOfPage = () => window.location.host
// The server does not know the host of the page on screen, so the address is the same-host one
// until the page is in the browser.
const noHost = () => null

/**
 * Gives the address of the start page of a view, on the host that shows it, as seen from the page
 * on screen. The address can be written in a link: it is complete once the page is in the browser.
 */
export function useViewStartHref(): (view: View) => string {
  const host = useSyncExternalStore(neverChanges, hostOfPage, noHost)
  return (view) => viewStartHref(view, host)
}
