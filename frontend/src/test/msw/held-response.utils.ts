/**
 * Holds a handler until the test lets it answer: the handler waits for `held`, and the test calls
 * `release` once it has looked at the page while the request is unanswered, such as the button
 * that is disabled while a form is sent.
 */
export function holdResponse() {
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  return { held, release }
}
