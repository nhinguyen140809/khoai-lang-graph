/** The words of uploading a source. */
export const uploadSourceMessages = {
  item: 'Upload source',
  /** What the description of a file says while it goes up. */
  uploading: 'Uploading',
  uploaded: (count: number) =>
    count === 1 ? 'Source uploaded' : `${String(count)} sources uploaded`,
  uploadedHint: 'The next runs of the project quote it.',
  notUploaded: (name: string) => `${name} could not be uploaded`,
  unsupportedFormat: (name: string, formats: string) =>
    `${name} is not a format that sources take: ${formats}.`,
  tooLarge: (name: string, limit: string) => `${name} is over ${limit}.`,
  remove: (name: string) => `Remove ${name}`,
  attachments: 'Sources to upload',
} as const
