// The key of an interview message is `<key of the persona>#<position>`.
const messageKeySeparator = '#'

/** The key of the item that an interview message is about: the key of the message without its position. */
export function subjectKeyOfMessage(key: string): string {
  return key.split(messageKeySeparator)[0] ?? key
}
