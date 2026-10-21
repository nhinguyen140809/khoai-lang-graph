import type { OutputLanguage } from './output-language.types'

/** The name of each output language, as a choice shows it. */
export const outputLanguageLabels = {
  en: 'English',
  vi: 'Vietnamese',
} as const satisfies Record<OutputLanguage, string>
