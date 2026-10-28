const text = 'I ask seniors in my club.\nI never know who is free this week, or who is free.'

/** A text, a quote, and where the quote sits in it. */
export const quoteCases = [
  {
    name: 'words that are in the text exactly',
    text,
    quote: 'I ask seniors in my club',
    expected: { start: 0, end: 24 },
  },
  {
    name: 'words in another case',
    text,
    quote: 'i NEVER know',
    expected: { start: 26, end: 38 },
  },
  {
    name: 'words that the text breaks across a line',
    text,
    quote: 'club. I never',
    expected: { start: 20, end: 33 },
  },
  {
    name: 'the first place, when the words come twice',
    text,
    quote: 'who is free',
    expected: { start: 39, end: 50 },
  },
  {
    name: 'words with signs that a pattern reads as its own',
    text: 'Pay (2 x $5) now?',
    quote: '(2 x $5) now?',
    expected: { start: 4, end: 17 },
  },
  { name: 'words that are not in the text', text, quote: 'I never sleep', expected: null },
  { name: 'a blank quote', text, quote: '  ', expected: null },
]
