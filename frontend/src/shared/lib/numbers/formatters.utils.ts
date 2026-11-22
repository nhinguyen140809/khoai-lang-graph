import { formatLocale } from '@/shared/config/locale'

/** A number with its thousands separated: 12345.6 as "12,345.6". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(formatLocale, { maximumFractionDigits: 2 }).format(value)
}

/** A ratio as a percentage: 0.256 as "26%", or "25.6%" with one digit. */
export function formatPercent(ratio: number, digits = 0): string {
  return new Intl.NumberFormat(formatLocale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio)
}

/**
 * An amount of money with two digits, as "$1.72"; an amount under one cent keeps four, so that the
 * cost of a short step does not read "$0.00".
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  const digits = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2
  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** The size of a file as "420 byte", "12.5 kB" or "3.2 MB", in the unit that reads best. */
export function formatFileSize(bytes: number): string {
  const kilobyte = 1024
  const units = [
    { unit: 'megabyte', size: kilobyte * kilobyte },
    { unit: 'kilobyte', size: kilobyte },
    { unit: 'byte', size: 1 },
  ] as const
  const { unit, size } = units.find((candidate) => bytes >= candidate.size) ?? units[2]
  return new Intl.NumberFormat(formatLocale, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
    maximumFractionDigits: 1,
  }).format(bytes / size)
}
