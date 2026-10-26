// Folders whose files are used through the index of the folder, not file by file.

// The browser storage is used through the index of its folder.
export const storageIndexPattern = {
  group: ['@/shared/lib/storage/**'],
  message: 'Import the storage from @/shared/lib/storage, its index.',
}

// The helpers of the unit tests are used through the index of their folder: @/test/msw,
// @/test/suites, @/test/next-stubs, @/test/render and @/test/steps.
export const testHelpersIndexPattern = {
  group: ['@/test/*/**'],
  message: 'Import the test helpers from the index of their folder, such as @/test/msw.',
}

// The helpers of the mocks in src/mocks/shared are used through the index of their folder from
// outside src/mocks: @/mocks/shared/db, @/mocks/shared/scenario and @/mocks/shared/http/<topic>.
// Inside src/mocks a file imports the file it needs, since the layers of the mocks are checked
// by the kind of each file.
export const mockHelpersIndexPattern = {
  group: ['@/mocks/shared/db/**', '@/mocks/shared/scenario/**', '@/mocks/shared/http/*/**'],
  message:
    'Import the helpers of the mocks from the index of their folder, such as @/mocks/shared/db.',
}
