import { z } from 'zod'

import { answerSchema, type Interrupt, type ReviewedItem } from './review.types'
import { buildResumeBody, validateReview } from './review-form.utils'

/**
 * The answer to a review: the option, its feedback and the answers to the questions, checked
 * against the checkpoint. Its value is the body of the resume request, with the items that the
 * user edited while the review waited.
 */
export function reviewFormSchema(interrupt: Interrupt, edited: ReviewedItem[]) {
  const optionOf = (key: string | null) => interrupt.options.find((option) => option.key === key)
  return z
    .object({
      option: z.string().nullable(),
      feedback: z.string(),
      answers: z.object(
        Object.fromEntries(interrupt.questions.map(({ key }) => [key, answerSchema])),
      ),
    })
    .superRefine((form, context) => {
      const problems = validateReview(interrupt, { ...form, option: optionOf(form.option) })
      for (const [field, message] of Object.entries(problems)) {
        const path = field === 'option' || field === 'feedback' ? [field] : ['answers', field]
        context.addIssue({ code: 'custom', message, path })
      }
    })
    .transform((form) =>
      buildResumeBody(interrupt, { ...form, option: optionOf(form.option), edited }),
    )
}

export type ReviewForm = z.input<ReturnType<typeof reviewFormSchema>>
