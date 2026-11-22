/** What a sign of work says to assistive technology when it stands alone: that work goes on. */
export const workingStatus = { role: 'status', 'aria-label': 'Working' } as const

/** What a sign of work beside words that name its status says: nothing, it hides from the readers of the words. */
export const markBesideWords = { 'aria-hidden': true } as const
