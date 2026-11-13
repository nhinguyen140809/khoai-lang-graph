/** How a value of a scale of five steps reads, from the lowest to the highest. */
const fiveStepLevels = ['Very low', 'Low', 'Moderate', 'High', 'Very high'] as const

export const contentValueMessages = {
  yes: 'Yes',
  no: 'No',
  /** Where a value stands on its scale: the words that the reader sees, and what a screen reader says. */
  level: (value: number, min: number, max: number) => {
    const steps = max - min + 1
    const words =
      steps === fiveStepLevels.length
        ? (fiveStepLevels[value - min] ?? '')
        : `${String(value)} of ${String(max)}`
    return { words, label: `${words}, ${String(value)} of ${String(max)}` }
  },
} as const
