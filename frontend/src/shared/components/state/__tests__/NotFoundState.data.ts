import type { StateSize } from '../state.types'

const defaultDescription = 'No page exists at this address. Check the link and try again.'

/** The props of the state, its action named by its label, and the texts it shows and hides. */
export const notFoundCases: {
  name: string
  props: { title?: string; reference?: string; size?: StateSize; action?: string }
  headings: string[]
  shown: string[]
  hidden: string[]
}[] = [
  {
    name: 'says the page was not found by default',
    props: {},
    headings: ['Page not found'],
    shown: [defaultDescription],
    hidden: [],
  },
  {
    name: 'shows its own title, the reference and the action',
    props: { title: 'Thread not found', reference: 'thread-42', action: 'Open the threads' },
    headings: ['Thread not found'],
    shown: ['thread-42', 'Open the threads'],
    hidden: [],
  },
  {
    name: 'shows only the title and the action in the compact size',
    props: { size: 'compact', reference: 'thread-42', action: 'Open the threads' },
    headings: [],
    shown: ['Page not found', 'Open the threads'],
    hidden: ['thread-42', defaultDescription],
  },
]
