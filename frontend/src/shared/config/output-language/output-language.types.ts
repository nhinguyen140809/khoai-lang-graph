/** The languages that the outputs of a project, and of its runs, are written in. */
export const outputLanguages = ['en', 'vi'] as const

export type OutputLanguage = (typeof outputLanguages)[number]
