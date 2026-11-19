import type { Hotkey } from '@/shared/lib/hotkey'

export const sidebarCookieName = 'sidebar_state'
export const sidebarCookieMaxAge = 60 * 60 * 24 * 7
export const sidebarWidth = '16rem'
export const sidebarWidthMobile = '100vw'
export const sidebarWidthIcon = '3rem'

/** The hotkey that folds and unfolds the sidebar, which the labels of its buttons show. */
export const sidebarHotkey: Hotkey = { key: 'b', mod: true }
