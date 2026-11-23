interface PickFilesOptions {
  /** The extensions that the picker offers, without the dot, such as `['txt', 'md']`; any file when none. */
  extensions?: readonly string[]
  /** Whether more than one file may be chosen. */
  isMultiple?: boolean
}

/**
 * Opens the file picker of the browser and resolves with the files that the user chose, or with
 * none when the user closes the picker. It must run from a click or a key press, which the
 * browser asks of anything that opens a picker.
 */
export function pickFiles({ extensions = [], isMultiple = false }: PickFilesOptions = {}): Promise<
  File[]
> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = isMultiple
    if (extensions.length > 0)
      input.accept = extensions.map((extension) => `.${extension}`).join(',')
    input.addEventListener('change', () => {
      resolve(input.files === null ? [] : [...input.files])
    })
    input.addEventListener('cancel', () => {
      resolve([])
    })
    input.click()
  })
}
