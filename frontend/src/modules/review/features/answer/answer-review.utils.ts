import type { ArtifactItem } from '@/modules/artifact/entities'
import type {
  Interrupt,
  InterruptOption,
  InterruptQuestion,
  ModifiedItem,
  ResumeRunBody,
} from '@/modules/review/entities'
import type { CheckpointOption, QuestionAnswer } from '@/modules/workflow/entities'
import { ApiError } from '@/shared/api/error'
import { isBlank } from '@/shared/lib/guards'

import { answerStepKeys } from './answer-review.constants'
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

/** The element `by` places from `current` in the list, none beyond its ends; the first or the last when `current` is not in it. */
export function neighborOf<T>(list: readonly T[], current: T, by: -1 | 1): T | undefined {
  const index = list.indexOf(current)
  if (index === -1) return by === 1 ? list.at(0) : list.at(-1)
  return list[index + by]
}

/** Whether an element is a choice of a step: a radio button, a check box, or an option of the review, which reads as a radio button. */
export function isChoice(element: Element): boolean {
  if (element instanceof HTMLInputElement) {
    return element.type === 'radio' || element.type === 'checkbox'
  }
  return element.getAttribute('role') === 'radio'
}

/** Whether an element is a line of text to write in, such as the answer to a free text question. */
export function isTextLine(element: Element): boolean {
  return (
    element instanceof HTMLInputElement &&
    !isChoice(element) &&
    !['button', 'submit', 'reset', 'hidden'].includes(element.type)
  )
}

/** Whether a choice is the one that is chosen. */
export function isChosen(element: Element): boolean {
  return element instanceof HTMLInputElement
    ? element.checked
    : element.getAttribute('aria-checked') === 'true'
}

/** Whether an element, or one that holds it, is inert: the step that is sliding out of view is. */
function isInert(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    if (node.hasAttribute('inert')) return true
  }
  return false
}

/** The controls of a form that match, but only in the step now shown: the one still sliding out of view is inert, and left out. */
export function answersOf(
  form: HTMLFormElement | null,
  matches: (element: Element) => boolean = isChoice,
): HTMLElement[] {
  return Array.from(form?.elements ?? []).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && matches(element) && !isInert(element),
  )
}

/** What the API found wrong with an answer, one line for each field it names; none when it names no field. */
export function problemsOf(error: Error): string | undefined {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) return undefined
  return error.fieldErrors.map(({ field, message }) => `${field}: ${message}`).join('\n')
}

/** Whether the caret of a line of text is at its start (`by` -1) or at its end (`by` 1); a field with no caret, such as a number, always is. */
export function isCaretAtEdge(input: HTMLInputElement, by: -1 | 1): boolean {
  const { selectionStart, selectionEnd, value } = input
  if (selectionStart === null || selectionEnd === null) return true
  return by === -1
    ? selectionStart === 0 && selectionEnd === 0
    : selectionStart === value.length && selectionEnd === value.length
}

/** The move that a key press asks for on the steps of an answer; none for another key or with a modifier held. */
export function stepKeyOf(
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>,
): (typeof answerStepKeys)[keyof typeof answerStepKeys] | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return undefined
  return event.key in answerStepKeys
    ? answerStepKeys[event.key as keyof typeof answerStepKeys]
    : undefined
}

/**
 * Whether a field keeps the key for itself. A box of text keeps all of them; a line of text keeps
 * those that move its caret, and lets go of Left at its start and of Right at its end, so the
 * writer is not held in it. Radio buttons, checkboxes and the rest let every key through.
 */
export function isKeptByField(
  target: EventTarget | null,
  key: (typeof answerStepKeys)[keyof typeof answerStepKeys],
): boolean {
  if (target instanceof HTMLTextAreaElement) return true
  if (!(target instanceof HTMLInputElement)) return false
  if (target.type === 'radio' || target.type === 'checkbox') return false
  return !(key.kind === 'step' && isCaretAtEdge(target, key.by))
}
