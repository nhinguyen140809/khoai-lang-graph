/** The content of a first message, and the name that the mock gives its project from it. */
export const nameFromMessageCases = [
  { name: 'a short idea', content: 'Mentor platform', projectName: 'Mentor platform' },
  {
    name: 'the first words of a long line',
    content: 'I want to build an online platform for university students.',
    projectName: 'I want to build an',
  },
  {
    name: 'the first line with text, without its last punctuation',
    content: '\n  Thesis tracker.\nFor the supervisors of a faculty.',
    projectName: 'Thesis tracker',
  },
  {
    name: 'an idea in Vietnamese',
    content: 'Nền tảng tìm người hướng dẫn cho sinh viên',
    projectName: 'Nền tảng tìm người hướng',
  },
]

/** A body of POST /threads/{thread_id}/messages that the mock refuses, as text. */
export const invalidMessageCases = [
  { name: 'no content', body: '{}' },
  { name: 'a blank content', body: '{"content": "  "}' },
  { name: 'a content that is not text', body: '{"content": 3}' },
  { name: 'a body that is not JSON', body: 'not json' },
]

/** A body of POST /projects, and the name of the project once its first message is sent. */
export const firstMessageCases = [
  { name: 'a project without a name', project: {}, projectName: 'Thesis tracker' },
  {
    name: 'a project with a name',
    project: { name: 'Clinic booking' },
    projectName: 'Clinic booking',
  },
]
