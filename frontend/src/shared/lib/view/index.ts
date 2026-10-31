// The views of the app and how the values of the system read in each. Code outside this folder
// imports them from here; files inside the folder import each other with relative paths.
export { useView } from './hooks/useView'
export { useWording } from './hooks/useWording'
export { type View, views, type Wording } from './view.types'
export { ViewProvider } from './ViewProvider'
