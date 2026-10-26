import { messages } from './messages.constants.js'
import { wrappedLibraryImports } from './wrapped-libraries.constants.js'

// A component of a slice reaches the API, the cache of the queries and the stores through the
// hooks of its slice, which hold what follows a call.
export const componentPatterns = [
  {
    regex: '\\.api$|^@/shared/api/request/',
    message: messages.componentCallsApi,
  },
  {
    regex: '\\.store$',
    message: 'A component reads and changes a store through a hook of its slice.',
  },
]

export const componentPaths = [
  ...wrappedLibraryImports,
  {
    name: '@/shared/api/request',
    importNames: ['apiRequest', 'apiCommand', 'fetchPage'],
    message: messages.componentCallsApi,
  },
  {
    name: '@tanstack/react-query',
    message: 'A component reads the queries and the mutations through a hook of its slice.',
  },
]
