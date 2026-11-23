import { create } from 'zustand'

import { removeEntry, setEntry } from '@/shared/lib/collections'

interface AnswersState {
  /** The runs that answer a message this page sent, each with the thread it was sent to. */
  watched: ReadonlyMap<string, string>
  watch: (runId: string, threadId: string) => void
  unwatch: (runId: string) => void
}

/**
 * The answers that this page is waiting for. What an answer asks the page to do, such as opening
 * a document, is done once, by the page that sent the message, when it sees the answer arrive; a
 * page that loads the thread later does none of it.
 */
export const useAnswersStore = create<AnswersState>()((set) => ({
  watched: new Map(),
  watch: (runId, threadId) => {
    set((state) => ({ watched: setEntry(state.watched, runId, threadId) }))
  },
  unwatch: (runId) => {
    set((state) => ({ watched: removeEntry(state.watched, runId) }))
  },
}))
