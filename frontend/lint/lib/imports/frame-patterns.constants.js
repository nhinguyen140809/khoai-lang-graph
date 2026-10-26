// The layers of the frame. A component reaches the state of the frame through hooks, a store may
// build on another store but never on a hook, and the pure files hold no React and no state.
export const frameComponentPattern = {
  regex: '\\.store$',
  allowTypeImports: true,
  message:
    'A component of the frame reads and changes its state through the hooks of its folder, not a store.',
}

export const frameStorePattern = {
  regex: '/hooks/',
  message: 'A store of the frame imports no hook: a hook runs only inside a component.',
}

export const frameHookPattern = {
  regex: '/components/(?!ui/)',
  message: 'A hook of the frame imports no component.',
}

export const framePurePaths = [
  {
    name: 'react',
    allowTypeImports: true,
    message: 'A pure file of the frame holds no React code.',
  },
  { name: 'zustand', message: 'A pure file of the frame holds no state.' },
]

export const framePurePattern = {
  regex: '\\.store$|/hooks/',
  message: 'A pure file of the frame imports no store and no hook.',
}
