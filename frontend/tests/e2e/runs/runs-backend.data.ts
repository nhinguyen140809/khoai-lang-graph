import { reviewsInOrder } from '../../shared/reviews.constants'

export const idea = 'A mobile app that lets neighbours share tools'

const [personas, analysis, specification] = reviewsInOrder

/**
 * A project started from an idea, which stops at every review: what each stop shows. The scripted
 * validator turns the first specification back, so the specification is reviewed twice.
 */
export const reviewStops = [
  // The agent words the question of this review itself, and asks about the interviewees first.
  {
    ...personas,
    prompt: 'I proposed the interviewees. Check that they cover the people who matter.',
    hasAsk: true,
  },
  {
    ...analysis,
    prompt:
      'I wrote the requirements analysis and found open questions. Check them, then approve it.',
    hasAsk: false,
  },
  { ...specification, hasAsk: false },
  { ...specification, hasAsk: false },
].map(({ status, prompt, approve, hasAsk }) => ({ status, prompt, approve, hasAsk }))

export const laterIdea = 'Also let neighbours rate each other.'
