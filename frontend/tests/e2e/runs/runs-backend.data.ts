import { reviewsInOrder } from '../../shared/reviews.constants'

export const idea = 'A mobile app that lets neighbours share tools'

const [personas, analysis, specification] = reviewsInOrder

/**
 * A project started from an idea, which stops at every review: what each stop shows. The scripted
 * validator turns the first specification back, so the specification is reviewed twice.
 */
export const reviewStops = [personas, analysis, specification, specification].map(
  ({ status, prompt, approve }) => ({ status, prompt, approve }),
)
