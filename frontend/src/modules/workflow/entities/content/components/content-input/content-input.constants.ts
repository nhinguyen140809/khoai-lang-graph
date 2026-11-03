export const contentInputMessages = {
  add: 'Add',
  removeEntry: (index: number, label: string) => `Remove entry ${String(index)} of ${label}`,
  none: 'None',
  chooseValue: 'Choose a value',
} as const
