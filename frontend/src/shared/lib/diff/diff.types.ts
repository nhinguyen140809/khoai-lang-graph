/**
 * One stretch of the words of a diff: the words as one text, and which of the compared texts
 * holds them. A stretch both hold is `same`, a stretch only the before holds is `removed`, and
 * one only the after holds is `added`.
 */
export interface DiffPart {
  text: string
  change: 'same' | 'removed' | 'added'
}
