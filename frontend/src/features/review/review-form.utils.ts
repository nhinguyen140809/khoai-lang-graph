import type {
  Answer,
  Interrupt,
  Question,
  ResumeBody,
  ReviewedItem,
  ReviewOption,
} from './review.types'

/** The option that is chosen first: the default one, else the first. */
export function defaultOption(options: ReviewOption[]): ReviewOption | undefined {
  return options.find(({ is_default }) => is_default) ?? options[0]
}

/** The answers that the form starts with: the default answer of each question. */
export function initialAnswers(questions: Question[]): Record<string, Answer> {
  return Object.fromEntries(questions.map((question) => [question.key, question.default_answer]))
}

/** What is wrong with the answer to a question, in the words of a form, or null. */
function problemWith(question: Question, answer: Answer | undefined): string | null {
  const chosen = answer?.choice_keys ?? []
  const text = answer?.text?.trim() ?? ''
  switch (question.type) {
    case 'single_select':
      if (question.required && chosen.length === 0) return 'Choose one.'
      break
    case 'multi_select': {
      const least = question.min_selected ?? (question.required ? 1 : 0)
      if (chosen.length < least) {
        return least === 1 ? 'Choose at least one.' : `Choose at least ${String(least)}.`
      }
      if (question.max_selected !== null && chosen.length > question.max_selected) {
        return `Choose at most ${String(question.max_selected)}.`
      }
      break
    }
    case 'free_text':
      if (question.required && text === '') return 'Write an answer.'
      break
    case 'number':
      if (question.required && (answer?.number ?? null) === null) return 'Enter a number.'
      break
  }
  const missing = question.choices.find(
    (choice) => choice.requires_text && chosen.includes(choice.key) && text === '',
  )
  return missing === undefined ? null : `Say more for "${missing.label}".`
}

/** The problems of the whole form by field: `feedback`, or the key of a question. */
export function validateReview(
  interrupt: Interrupt,
  input: { option: ReviewOption | undefined; feedback: string; answers: Record<string, Answer> },
): Record<string, string> {
  const problems: Record<string, string> = {}
  if (interrupt.options.length > 0 && input.option === undefined) problems.option = 'Choose one.'
  if (input.option?.requires_feedback === true && input.feedback.trim() === '') {
    problems.feedback = 'Write the feedback.'
  }
  for (const question of interrupt.questions) {
    const problem = problemWith(question, input.answers[question.key])
    if (problem !== null) problems[question.key] = problem
  }
  return problems
}

/** The items that the user changed while the review waited, with their version now. */
export function editedItems(items: ReviewedItem[]): ReviewedItem[] {
  return items.filter((item) => item.updated_by.actor === 'user' && item.version > 1)
}

export function buildResumeBody(
  interrupt: Interrupt,
  input: {
    option: ReviewOption | undefined
    feedback: string
    answers: Record<string, Answer>
    edited: ReviewedItem[]
  },
): ResumeBody {
  const feedback = input.feedback.trim()
  return {
    interrupt_id: interrupt.id,
    option: input.option?.key ?? null,
    feedback: input.option?.requires_feedback === true && feedback !== '' ? feedback : null,
    answers: input.answers,
    modified_items: interrupt.allow_edits
      ? input.edited.map((item) => ({ item_id: item.id, version: item.version }))
      : [],
  }
}
