import { isBlank, isRecord, isString } from '@/shared/lib/guards'

/** A value as plain text, for a table cell or a summary: a dash when it is blank, a list joined by "; ". */
export function jsonToPlainText(value: unknown): string {
  if (isBlank(value)) return '-'
  if (isString(value)) return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        isRecord(entry)
          ? Object.values(entry).map(jsonToPlainText).join(' / ')
          : jsonToPlainText(entry),
      )
      .join('; ')
  }
  return JSON.stringify(value)
}
