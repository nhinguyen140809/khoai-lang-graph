import { pageTitleSeparator, siteTitle } from './title.constants'

/** The title of the tab for a page: its name, then the name of the app; the app alone without a name. */
export function pageTitle(name: string | null | undefined): string {
  if (name === null || name === undefined || name === '') return siteTitle
  return `${name}${pageTitleSeparator}${siteTitle}`
}
