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
export const areaPathCases = [
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
  { path: '/developer', isArea: true, address: '/' },
  { path: '/developer/projects', isArea: true, address: '/projects' },
  { path: '/developer/projects/p1', isArea: true, address: '/projects/p1' },
  { path: '/user', isArea: true, address: '/' },
  { path: '/user/settings', isArea: true, address: '/settings' },
  { path: '/developers', isArea: false, address: '/developers' },
  { path: '/users/u1', isArea: false, address: '/users/u1' },
  { path: '/login', isArea: false, address: '/login' },
  { path: '/', isArea: false, address: '/' },
] as const

/** A host of a request, and the host that shows each view. */
export const hostOfViewCases = [
  { host: 'localhost:3000', user: 'localhost:3000', developer: 'dev.localhost:3000' },
  { host: 'dev.localhost:3000', user: 'localhost:3000', developer: 'dev.localhost:3000' },
  { host: 'app.example.com', user: 'app.example.com', developer: 'dev.app.example.com' },
]
