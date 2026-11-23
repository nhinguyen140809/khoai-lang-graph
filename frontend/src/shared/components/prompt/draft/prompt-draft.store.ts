import { create } from 'zustand'

import { draftsWith } from './prompt-draft.utils'

interface PromptDraftState {
  /** By the name of the prompt, the text written in it and not sent; a blank text is no draft. */
  drafts: Readonly<Record<string, string>>
  /** Keeps the text written in the prompt with this name; a blank text forgets the draft. */
  setDraft: (name: string, text: string) => void
  /** Forgets the draft of the prompt with this name. */
  forgetDraft: (name: string) => void
}

/**
 * The text written in each prompt and not sent, by the name of the prompt, so that a prompt shows
 * what was written in it when its page is left and shown again. It lives as long as the app is
 * open: a reload ends it, and `usePromptDraft` warns before that happens.
 */
export const usePromptDraftStore = create<PromptDraftState>()((set) => ({
  drafts: {},
  setDraft: (name, text) => {
    set((state) => {
      const drafts = draftsWith(state.drafts, name, text)
      return drafts === state.drafts ? state : { drafts }
    })
  },
  forgetDraft: (name) => {
    set((state) => {
      const drafts = draftsWith(state.drafts, name, '')
      return drafts === state.drafts ? state : { drafts }
    })
  },
}))

/** Forgets the draft of the prompt with this name, such as once what it said has been done. */
export function forgetPromptDraft(name: string): void {
  usePromptDraftStore.getState().forgetDraft(name)
}
