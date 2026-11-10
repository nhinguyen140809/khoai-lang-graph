import type { ArtifactItem } from '@/modules/artifact/entities'
import type {
  Interrupt,
  InterruptOption,
  InterruptQuestion,
  ModifiedItem,
  ResumeRunBody,
} from '@/modules/review/entities'
import type { CheckpointOption, QuestionAnswer } from '@/modules/workflow/entities'
import { isBlank } from '@/shared/lib/guards'

import type { AnswerProblem, AnswerReviewFormValues } from './answer-review.types'

/** The option that the form starts with: the default one, else the first; none without options. */
export function defaultOption<T extends CheckpointOption>(options: readonly T[]): T | undefined {
  return options.find(({ is_default }) => is_default) ?? options[0]
}

/**
 * The feedback after the user chooses an option: the feedback that the option suggests, unless the
 * user has written their own, which stays. Feedback is the user's own when it is not empty and is
 * not the suggestion of the option that was chosen before.
 */
export function feedbackAfterSelect(
  current: string,
  previous: InterruptOption | undefined,
  next: InterruptOption,
): string {
  const isUntouched = isBlank(current) || current === previous?.suggested_feedback
  return isUntouched ? (next.suggested_feedback ?? '') : current
}

/** The answers that the form starts with: the default answer of each question. */
export function initialAnswers(
  questions: readonly InterruptQuestion[],
): Record<string, QuestionAnswer> {
  return Object.fromEntries(
    questions.map((question) => [
      question.key,
      question.default_answer ?? { choice_keys: [], text: null, number: null },
    ]),
  )
}

interface ProblemInput {
  question: InterruptQuestion
  chosen: readonly string[]
  hasText: boolean
  number: number | null
}

/** What each type of question needs before its answer can be sent; null when it is complete. */
const problemOfQuestion = {
  single_select: ({ question, chosen }: ProblemInput) =>
    question.required && chosen.length === 0 ? { type: 'chooseOne' } : null,
  multi_select: ({ question, chosen }: ProblemInput) => {
    const least = question.min_selected ?? (question.required ? 1 : 0)
    if (chosen.length < least) return { type: 'chooseAtLeast', count: least }
    if (question.max_selected !== null && chosen.length > question.max_selected) {
      return { type: 'chooseAtMost', count: question.max_selected }
    }
    return null
  },
  free_text: ({ question, hasText }: ProblemInput) =>
    question.required && !hasText ? { type: 'writeAnswer' } : null,
  number: ({ question, number }: ProblemInput) =>
    question.required && number === null ? { type: 'enterNumber' } : null,
} as const satisfies Record<
  InterruptQuestion['type'],
  (input: ProblemInput) => AnswerProblem | null
>

/** What is wrong with the answer to a question, with the count or the label that its words name; null when nothing is. */
export function answerProblem(
  question: InterruptQuestion,
  answer: QuestionAnswer | undefined,
): AnswerProblem | null {
  const chosen = answer?.choice_keys ?? []
  const text = answer?.text ?? ''
  const hasText = !isBlank(text)
  const problem = problemOfQuestion[question.type]({
    question,
    chosen,
    hasText,
    number: answer?.number ?? null,
  })
  if (problem !== null) return problem
  const missing = question.choices.find(
    (choice) => choice.requires_text && chosen.includes(choice.key) && !hasText,
  )
  return missing === undefined ? null : { type: 'explainChoice', label: missing.label }
}

/** The body that answers the review with the values of the form and the items edited before it. */
export function resumeRunBody(
  interrupt: Interrupt,
  values: AnswerReviewFormValues,
  editedItems: readonly ArtifactItem[],
): ResumeRunBody {
  return {
    interrupt_id: interrupt.id,
    option: values.option,
    feedback: isBlank(values.feedback) ? null : values.feedback.trim(),
    answers: values.answers,
    modified_items: modifiedItemsOf(interrupt, editedItems),
  }
}

/** The edited items as the resume body names them; none when the review does not take edits. */
export function modifiedItemsOf(
  interrupt: Pick<Interrupt, 'allow_edits'>,
  items: readonly ArtifactItem[],
): ModifiedItem[] {
  if (!interrupt.allow_edits) return []
  return items.map(({ id, version }) => ({ item_id: id, version }))
}
