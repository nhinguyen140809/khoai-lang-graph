/** Waits until the browser has painted the next animation frame, so that what a MotionValue drives on the frame shows in the document. */
export function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve()
    })
  })
}
