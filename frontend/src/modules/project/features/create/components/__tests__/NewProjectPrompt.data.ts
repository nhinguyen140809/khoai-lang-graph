/** How the idea is sent, the idea typed, and the idea that the prompt sends. */
export const startCases = [
  {
    by: 'Enter',
    idea: 'Mentor platform\nFor university students.',
    sent: 'Mentor platform\nFor university students.',
  },
  { by: 'Create project', idea: '  Library booking. ', sent: 'Library booking.' },
] as const

/** An idea that the prompt does not send. */
export const blankIdeas = ['', '  \n ']
