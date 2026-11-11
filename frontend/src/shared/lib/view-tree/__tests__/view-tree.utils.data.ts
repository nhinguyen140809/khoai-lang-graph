/** A host and the view it shows. */
export const hostCases = [
  { host: 'dev.localhost:3000', view: 'developer' },
  { host: 'dev.example.com', view: 'developer' },
  { host: 'localhost:3000', view: 'user' },
  { host: 'example.com', view: 'user' },
  { host: 'developer.example.com', view: 'user' },
  { host: 'devtools.example.com', view: 'user' },
  { host: '127.0.0.1:3000', view: 'user' },
  { host: null, view: 'user' },
] as const

/** An address, and the page of each view that it names. */
export const treePathCases = [
  { address: '/', developer: '/developer', user: '/user' },
  { address: '/projects', developer: '/developer/projects', user: '/user/projects' },
  {
    address: '/projects/p1/activity',
    developer: '/developer/projects/p1/activity',
    user: '/user/projects/p1/activity',
  },
] as const

/** A path, whether it starts with the folder of a view, and the address it has. */
export const addressCases = [
  { path: '/developer', isTree: true, address: '/' },
  { path: '/developer/projects', isTree: true, address: '/projects' },
  { path: '/developer/projects/p1', isTree: true, address: '/projects/p1' },
  { path: '/user', isTree: true, address: '/' },
  { path: '/user/settings', isTree: true, address: '/settings' },
  { path: '/developers', isTree: false, address: '/developers' },
  { path: '/users/u1', isTree: false, address: '/users/u1' },
  { path: '/login', isTree: false, address: '/login' },
  { path: '/', isTree: false, address: '/' },
] as const
