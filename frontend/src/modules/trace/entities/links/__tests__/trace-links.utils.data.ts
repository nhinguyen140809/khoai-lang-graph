/** A link made at a version of its target, the target now, and whether the link is out of date. */
export const outOfDateCases = [
  {
    name: 'a link made against the current version',
    link: { target_version: 2 },
    target: { version: 2, review_status: 'approved' as const },
    expected: false,
  },
  {
    name: 'a link made against an older version',
    link: { target_version: 1 },
    target: { version: 2, review_status: 'approved' as const },
    expected: true,
  },
  {
    name: 'a link to a target that was replaced',
    link: { target_version: 2 },
    target: { version: 2, review_status: 'superseded' as const },
    expected: true,
  },
  {
    name: 'a link made against a version newer than the target has',
    link: { target_version: 3 },
    target: { version: 2, review_status: 'draft' as const },
    expected: false,
  },
]
