import { topicEntityModules } from '../file-names/file-kinds.constants.js'

/**
 * The topics of the entities of a module split by topic, or none for a module that is not.
 * @param {string} moduleName
 * @returns {string[]}
 */
export function entityTopics(moduleName) {
  return Object.keys(topicEntityModules[moduleName] ?? {})
}

/**
 * The patterns that keep a topic of the entities of a module to the topics that it reads: a relative
 * import of another topic, or of the components of the entities, is refused.
 * @param {string} moduleName
 * @param {string} topic
 * @returns {{ regex: string, message: string }[]}
 */
export function topicPatterns(moduleName, topic) {
  const readTopics = topicEntityModules[moduleName]?.[topic]
  if (readTopics === undefined) {
    throw new Error(`The topic ${topic} of ${moduleName} has no list in topicEntityModules.`)
  }
  const unreadTopics = entityTopics(moduleName).filter(
    (other) => other !== topic && !readTopics.includes(other),
  )
  const read = readTopics.length === 0 ? 'no other topic' : readTopics.join(', ')
  return [
    {
      regex: `^(\\.\\./)+(${[...unreadTopics, 'components'].join('|')})(/|$)`,
      message: `The topics of the entities depend one way: ${topic} reads ${read} (topicEntityModules).`,
    },
  ]
}
