import { messages } from './messages.constants.js'

// The layers above the modules, which no module and no shared code imports.
const outsideLayers = ['app', 'providers']

export const outsideLayersGroup = outsideLayers.flatMap((name) => [`@/${name}`, `@/${name}/**`])

/** A file under the layers of a module reaches neither the app nor the providers. */
export const outsideLayersPatterns = [
  { group: outsideLayersGroup, message: messages.layerOrder },
  { regex: `^(\\.\\./)+(src/)?(${outsideLayers.join('|')})(/|$)`, message: messages.layerOrder },
]
