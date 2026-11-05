import { formatLocale } from '@/shared/config/locale'

/** The form of a word for a count, by the plural rules of the locale of the app: "minute" for 1, "minutes" for 2. */
export function pluralForm(count: number, forms: { one: string; other: string }): string {
  const rules = new Intl.PluralRules(formatLocale)
  return rules.select(count) === 'one' ? forms.one : forms.other
}
