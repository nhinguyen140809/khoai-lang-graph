/** How writing to the clipboard ends, and the toast that says so. */
export const copyCases = [
  {
    name: 'copies the text of the entry',
    writeText: () => Promise.resolve(),
    toast: 'success',
    message: 'Copied',
  },
  {
    name: 'says how to copy when the clipboard refuses',
    writeText: () => Promise.reject(new Error('Denied')),
    toast: 'error',
    message: 'Copying failed. Select the text and copy it instead.',
  },
] as const
