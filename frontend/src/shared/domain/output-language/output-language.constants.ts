/** The languages that the outputs of a project, and of its runs, are written in. */
export const outputLanguages = ['en', 'vi'] as const

/** The name of each output language, as a choice shows it. */
export const outputLanguageLabels = {
  en: 'English',
  vi: 'Vietnamese',
} as const satisfies Record<(typeof outputLanguages)[number], string>
